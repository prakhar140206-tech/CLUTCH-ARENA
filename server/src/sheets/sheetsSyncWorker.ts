import { persistenceStore, SheetsOutboxRecord } from '../storage/db.js';
import { googleSheetsService } from './googleSheetsService.js';

export interface WorkerConfig {
  intervalMs: number;
  batchSize: number;
  maxRetries: number;
}

export class SheetsSyncWorker {
  private intervalTimer: NodeJS.Timeout | null = null;
  private isProcessing: boolean = false;
  private config: WorkerConfig;
  private stats = {
    totalSynced: 0,
    totalFailed: 0,
    lastRunTimestamp: 0,
    lastError: null as string | null
  };

  constructor(config?: Partial<WorkerConfig>) {
    this.config = {
      intervalMs: config?.intervalMs || 5000,
      batchSize: config?.batchSize || 50,
      maxRetries: config?.maxRetries || 5
    };
  }

  /**
   * Starts the background outbox polling loop
   */
  public start(): void {
    if (this.intervalTimer) return;

    // Check once at startup asynchronously
    setTimeout(() => {
      this.processOutboxBatch().catch((err) => {
        console.warn('[SheetsSyncWorker] Initial batch processing error:', err.message);
      });
    }, 2000);

    this.intervalTimer = setInterval(() => {
      this.processOutboxBatch().catch((err) => {
        console.warn('[SheetsSyncWorker] Polling error:', err.message);
      });
    }, this.config.intervalMs);

    console.log(`[SheetsSyncWorker] Background sync worker initialized (poll interval: ${this.config.intervalMs}ms)`);
  }

  /**
   * Stops the background outbox polling loop
   */
  public stop(): void {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
      console.log('[SheetsSyncWorker] Background sync worker stopped');
    }
  }

  /**
   * Safely enqueues a record into the durable PostgreSQL outbox (or local JSON fallback).
   * Asynchronous and non-blocking — never delays player match or gameplay.
   */
  public async enqueue(
    worksheet: 'Users' | 'MatchResults' | 'CustomRooms' | 'QuestionAttempts' | 'Progress' | 'PlatformEvents' | 'SyncMonitoring' | string,
    rowData: Record<string, any>,
    idempotencyKey?: string
  ): Promise<string> {
    const id = idempotencyKey || `sync_${worksheet.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    try {
      await persistenceStore.enqueueSheetsOutbox({
        id,
        worksheet,
        rowData
      });
      return id;
    } catch (err: any) {
      console.error(`[SheetsSyncWorker] Failed to enqueue event for ${worksheet}:`, err.message);
      return id;
    }
  }

  /**
   * Processes a batch of pending records from the durable outbox
   */
  public async processOutboxBatch(): Promise<{
    processed: number;
    synced: number;
    failed: number;
  }> {
    if (this.isProcessing) {
      return { processed: 0, synced: 0, failed: 0 };
    }

    if (!googleSheetsService.isEnabled()) {
      return { processed: 0, synced: 0, failed: 0 };
    }

    this.isProcessing = true;
    const startTime = Date.now();
    let syncedCount = 0;
    let failedCount = 0;

    try {
      const pendingRecords = await persistenceStore.fetchPendingSheetsOutbox(this.config.batchSize);
      if (!pendingRecords || pendingRecords.length === 0) {
        return { processed: 0, synced: 0, failed: 0 };
      }

      // Group records by worksheet
      const grouped = new Map<string, SheetsOutboxRecord[]>();
      for (const rec of pendingRecords) {
        // Exponential backoff check: skip if updated recently and retryCount > 0
        if (rec.retryCount > 0) {
          const backoffDelayMs = Math.min(60000, 1000 * Math.pow(2, rec.retryCount));
          if (Date.now() - rec.updatedAt < backoffDelayMs) {
            continue;
          }
        }

        const list = grouped.get(rec.worksheet) || [];
        list.push(rec);
        grouped.set(rec.worksheet, list);
      }

      for (const [worksheet, records] of grouped.entries()) {
        const rows = records.map(r => r.rowData);
        const result = await googleSheetsService.appendRows(worksheet, rows);

        if (result.success) {
          for (const rec of records) {
            await persistenceStore.updateSheetsOutboxStatus(rec.id, 'synced');
            syncedCount++;
          }
        } else {
          for (const rec of records) {
            await persistenceStore.updateSheetsOutboxStatus(rec.id, 'failed', result.error);
            failedCount++;
          }
          this.stats.lastError = result.error || 'Unknown append error';
        }
      }

      this.stats.totalSynced += syncedCount;
      this.stats.totalFailed += failedCount;
      this.stats.lastRunTimestamp = Date.now();

      // If SyncMonitoring exists, record summary event if we synced items or encountered errors
      if (syncedCount > 0 || failedCount > 0) {
        const monitoringWorksheet = googleSheetsService.resolveWorksheetName('SyncMonitoring');
        if (monitoringWorksheet) {
          const syncDurationMs = Date.now() - startTime;
          await googleSheetsService.appendRows(monitoringWorksheet, [
            {
              id: `mon_${Date.now()}`,
              timestamp: new Date().toISOString(),
              worksheet: Array.from(grouped.keys()).join(','),
              itemsSynced: syncedCount,
              retryCount: failedCount,
              status: failedCount === 0 ? 'SUCCESS' : 'PARTIAL_OR_FAILED',
              lastError: this.stats.lastError || '',
              syncDurationMs
            }
          ]).catch(() => {});
        }
      }

      return {
        processed: syncedCount + failedCount,
        synced: syncedCount,
        failed: failedCount
      };
    } catch (err: any) {
      this.stats.lastError = googleSheetsService.redactError(err.message || String(err));
      console.warn('[SheetsSyncWorker] Batch processing exception:', this.stats.lastError);
      return { processed: 0, synced: syncedCount, failed: failedCount };
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Diagnostic metrics for health checks and status endpoints
   */
  public async getMetrics(): Promise<any> {
    const queueStats = await persistenceStore.getSheetsOutboxStats();
    return {
      workerRunning: Boolean(this.intervalTimer),
      isProcessing: this.isProcessing,
      intervalMs: this.config.intervalMs,
      queue: queueStats,
      lifetimeSynced: this.stats.totalSynced,
      lifetimeFailed: this.stats.totalFailed,
      lastRunTimestamp: this.stats.lastRunTimestamp,
      lastError: this.stats.lastError
    };
  }
}

export const sheetsSyncWorker = new SheetsSyncWorker();
