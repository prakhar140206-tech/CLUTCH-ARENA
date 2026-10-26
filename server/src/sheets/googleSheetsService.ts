import { google, sheets_v4 } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

export interface GoogleSheetsConfig {
  enabled: boolean;
  spreadsheetId: string;
  credentialsPath?: string;
  credentialsJson?: string;
  clientEmail?: string;
  privateKey?: string;
}

export interface DiscoveredSheetInfo {
  title: string;
  headers: string[];
}

export interface SheetsDiagnosticStatus {
  enabled: boolean;
  configured: boolean;
  spreadsheetId: string | null;
  credentialsConfigured: boolean;
  credentialsSource: 'path' | 'inline_json' | 'env_pair' | 'none';
  authenticated: boolean;
  accessible: boolean;
  discoveredWorksheets: string[];
  worksheetHeaders: Record<string, string[]>;
  lastCheckTimestamp: number;
  lastError: string | null;
}

export class GoogleSheetsService {
  private config: GoogleSheetsConfig;
  private sheetsClient: sheets_v4.Sheets | null = null;
  private authClient: any = null;
  private worksheetCache: Map<string, string[]> = new Map();
  private lastCheckStatus: SheetsDiagnosticStatus;
  private isInitializing: boolean = false;

  constructor(customConfig?: Partial<GoogleSheetsConfig>) {
    this.config = {
      enabled: (customConfig?.enabled ?? process.env.GOOGLE_SHEETS_ENABLED === 'true'),
      spreadsheetId: (customConfig?.spreadsheetId ?? process.env.GOOGLE_SHEETS_SPREADSHEET_ID ?? '').trim(),
      credentialsPath: (customConfig?.credentialsPath ?? process.env.GOOGLE_APPLICATION_CREDENTIALS ?? '').trim(),
      credentialsJson: (customConfig?.credentialsJson ?? process.env.GOOGLE_SHEETS_CREDENTIALS_JSON ?? '').trim(),
      clientEmail: (customConfig?.clientEmail ?? process.env.GOOGLE_SHEETS_CLIENT_EMAIL ?? '').trim(),
      privateKey: (customConfig?.privateKey ?? process.env.GOOGLE_SHEETS_PRIVATE_KEY ?? '').trim()
    };

    let source: 'path' | 'inline_json' | 'env_pair' | 'none' = 'none';
    if (this.config.credentialsPath && fs.existsSync(this.config.credentialsPath)) {
      source = 'path';
    } else if (this.config.credentialsJson) {
      source = 'inline_json';
    } else if (this.config.clientEmail && this.config.privateKey) {
      source = 'env_pair';
    }

    this.lastCheckStatus = {
      enabled: this.config.enabled,
      configured: Boolean(this.config.spreadsheetId && source !== 'none'),
      spreadsheetId: this.config.spreadsheetId || null,
      credentialsConfigured: source !== 'none',
      credentialsSource: source,
      authenticated: false,
      accessible: false,
      discoveredWorksheets: [],
      worksheetHeaders: {},
      lastCheckTimestamp: Date.now(),
      lastError: null
    };
  }

  public isEnabled(): boolean {
    return this.config.enabled;
  }

  public getSpreadsheetId(): string {
    return this.config.spreadsheetId;
  }

  /**
   * Initializes the Google Auth client and Sheets API
   */
  public async initialize(): Promise<boolean> {
    if (!this.config.enabled) {
      this.lastCheckStatus.lastError = 'Google Sheets sync is disabled (GOOGLE_SHEETS_ENABLED != true)';
      return false;
    }

    if (!this.config.spreadsheetId) {
      this.lastCheckStatus.lastError = 'GOOGLE_SHEETS_SPREADSHEET_ID is missing or empty';
      return false;
    }

    if (this.isInitializing) return false;
    this.isInitializing = true;

    try {
      let auth: any;

      if (this.config.credentialsPath && fs.existsSync(this.config.credentialsPath)) {
        auth = new google.auth.GoogleAuth({
          keyFile: this.config.credentialsPath,
          scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });
        this.lastCheckStatus.credentialsSource = 'path';
      } else if (this.config.credentialsJson) {
        let creds: any;
        try {
          creds = JSON.parse(this.config.credentialsJson);
        } catch {
          // Check if base64 encoded
          const decoded = Buffer.from(this.config.credentialsJson, 'base64').toString('utf-8');
          creds = JSON.parse(decoded);
        }
        auth = new google.auth.GoogleAuth({
          credentials: creds,
          scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });
        this.lastCheckStatus.credentialsSource = 'inline_json';
      } else if (this.config.clientEmail && this.config.privateKey) {
        const formattedKey = this.config.privateKey.replace(/\\n/g, '\n');
        auth = new google.auth.JWT({
          email: this.config.clientEmail,
          key: formattedKey,
          scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });
        this.lastCheckStatus.credentialsSource = 'env_pair';
      } else {
        // Attempt default environment credentials if available
        auth = new google.auth.GoogleAuth({
          scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });
      }

      this.authClient = await auth.getClient();
      this.sheetsClient = google.sheets({ version: 'v4', auth: this.authClient });
      this.lastCheckStatus.authenticated = true;

      // Discover worksheets and headers
      await this.discoverWorksheetHeaders();
      this.lastCheckStatus.accessible = true;
      this.lastCheckStatus.lastError = null;
      this.lastCheckStatus.lastCheckTimestamp = Date.now();
      return true;
    } catch (err: any) {
      const sanitized = this.redactError(err.message || String(err));
      this.lastCheckStatus.authenticated = false;
      this.lastCheckStatus.accessible = false;
      this.lastCheckStatus.lastError = sanitized;
      this.lastCheckStatus.lastCheckTimestamp = Date.now();
      console.warn(`[GoogleSheetsService] Initialization/Validation warning: ${sanitized}`);
      return false;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Discovers worksheets in the spreadsheet and caches their header rows
   */
  public async discoverWorksheetHeaders(): Promise<Record<string, string[]>> {
    if (!this.sheetsClient || !this.config.spreadsheetId) {
      throw new Error('Google Sheets client not initialized or spreadsheetId missing');
    }

    const metadata = await this.sheetsClient.spreadsheets.get({
      spreadsheetId: this.config.spreadsheetId,
      fields: 'sheets.properties.title'
    });

    const sheets = metadata.data.sheets || [];
    const titles = sheets.map(s => s.properties?.title || '').filter(Boolean);
    this.lastCheckStatus.discoveredWorksheets = titles;

    const headersMap: Record<string, string[]> = {};

    for (const title of titles) {
      try {
        const headerRes = await this.sheetsClient.spreadsheets.values.get({
          spreadsheetId: this.config.spreadsheetId,
          range: `'${title}'!1:1`
        });
        const rows = headerRes.data.values;
        if (rows && rows.length > 0 && Array.isArray(rows[0])) {
          const rawHeaders = rows[0].map(h => String(h).trim());
          headersMap[title] = rawHeaders;
          this.worksheetCache.set(title, rawHeaders);
        } else {
          headersMap[title] = [];
          this.worksheetCache.set(title, []);
        }
      } catch (err: any) {
        console.warn(`[GoogleSheetsService] Could not read row 1 headers for "${title}": ${err.message}`);
        headersMap[title] = [];
        this.worksheetCache.set(title, []);
      }
    }

    this.lastCheckStatus.worksheetHeaders = headersMap;
    return headersMap;
  }

  /**
   * Finds the exact worksheet name case-insensitively
   */
  public resolveWorksheetName(expectedName: string): string | null {
    const target = expectedName.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const title of this.lastCheckStatus.discoveredWorksheets) {
      const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanTitle === target) {
        return title;
      }
    }
    return null;
  }

  /**
   * Maps a record object to the exact column positions defined by worksheet headers
   */
  public mapRecordToHeaders(worksheet: string, record: Record<string, any>): any[] {
    const headers = this.worksheetCache.get(worksheet) || [];
    if (headers.length === 0) {
      // Fallback: If no headers were discovered in row 1, serialize object values in key order
      return Object.values(record).map(v => this.formatCellValue(v));
    }

    return headers.map(header => {
      const value = this.extractMatchingFieldValue(header, record);
      return this.formatCellValue(value);
    });
  }

  /**
   * Maps a header string to the most appropriate field in the record
   */
  private extractMatchingFieldValue(header: string, record: Record<string, any>): any {
    const cleanHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '');

    // 1. Direct case-insensitive match against record keys
    for (const [recKey, val] of Object.entries(record)) {
      const cleanKey = recKey.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanKey === cleanHeader && val !== undefined && val !== null) {
        return val;
      }
    }

    // 2. Bidirectional Synonym Groups
    const SYNONYM_GROUPS: string[][] = [
      ['userid', 'playerid', 'user_id', 'player_id', 'id'],
      ['username', 'player', 'callsign', 'pilot', 'name', 'username'],
      ['email', 'useremail', 'mail'],
      ['ranktier', 'rank', 'tier'],
      ['aurapoints', 'aura', 'points'],
      ['auratitle', 'title'],
      ['createdat', 'created', 'joineddate', 'joined', 'date', 'timestamp'],
      ['lastactive', 'lastseen', 'updatedat', 'updated'],
      ['matchid', 'id'],
      ['mode', 'gamemode'],
      ['durationseconds', 'durationsec', 'duration'],
      ['durationms', 'durationmillis'],
      ['winnerid', 'winner'],
      ['winnerusername', 'winnername', 'winner'],
      ['winnerscore', 'score'],
      ['participantscount', 'participants', 'playerscount', 'players'],
      ['roomid', 'id'],
      ['code', 'roomcode'],
      ['hostid', 'host'],
      ['hostusername', 'hostcallsign', 'hostname', 'host'],
      ['maxplayers', 'maxcapacity', 'capacity'],
      ['totalrounds', 'rounds'],
      ['matchdurationminutes', 'durationminutes'],
      ['isprivate', 'private'],
      ['status', 'state'],
      ['submissionid', 'id', 'idempotencykey'],
      ['roundindex', 'round', 'roundnumber'],
      ['challengeid', 'questionid', 'id'],
      ['topic', 'category', 'discipline'],
      ['difficulty', 'level'],
      ['iscorrect', 'correct', 'result'],
      ['pointsawarded', 'points', 'scoreawarded'],
      ['speedbonus', 'bonus'],
      ['timetakenms', 'responsetimems', 'timems', 'timetaken', 'durationms', 'time'],
      ['masteryscore', 'mastery', 'score'],
      ['currentdifficulty', 'difficulty', 'level'],
      ['questionsattempted', 'attempted', 'totalattempts'],
      ['questionssolved', 'solved', 'totalsolved'],
      ['recentaccuracy', 'accuracy', 'winrate'],
      ['lastupdated', 'updatedat', 'timestamp'],
      ['eventid', 'id'],
      ['eventtype', 'type', 'event'],
      ['source', 'origin'],
      ['details', 'payload', 'data', 'meta'],
      ['itemssynced', 'syncedcount', 'count'],
      ['retrycount', 'retries'],
      ['lasterror', 'error', 'errormessage'],
      ['syncdurationms', 'durationms', 'duration']
    ];

    // Find all groups matching the header
    const matchingGroups = SYNONYM_GROUPS.filter(group => group.includes(cleanHeader));

    for (const group of matchingGroups) {
      for (const [recKey, val] of Object.entries(record)) {
        if (val === undefined || val === null) continue;
        const cleanKey = recKey.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (group.includes(cleanKey)) {
          return val;
        }
      }
    }

    return '';
  }

  /**
   * Formats cell values properly for Google Sheets
   */
  private formatCellValue(val: any): string | number | boolean {
    if (val === undefined || val === null) return '';
    if (typeof val === 'boolean' || typeof val === 'number') return val;
    if (val instanceof Date) return val.toISOString();
    if (typeof val === 'object') {
      try {
        return JSON.stringify(val);
      } catch {
        return String(val);
      }
    }
    return String(val);
  }

  /**
   * Appends batch of mapped rows to the specified worksheet
   */
  public async appendRows(worksheetName: string, rows: Record<string, any>[]): Promise<{
    success: boolean;
    syncedCount: number;
    error?: string;
  }> {
    if (!this.config.enabled) {
      return { success: false, syncedCount: 0, error: 'Google Sheets sync disabled' };
    }

    if (!this.sheetsClient || !this.config.spreadsheetId) {
      await this.initialize();
      if (!this.sheetsClient) {
        return { success: false, syncedCount: 0, error: this.lastCheckStatus.lastError || 'Sheets client unavailable' };
      }
    }

    const resolvedWorksheet = this.resolveWorksheetName(worksheetName) || worksheetName;
    const mappedRows = rows.map(r => this.mapRecordToHeaders(resolvedWorksheet, r));

    try {
      await this.sheetsClient.spreadsheets.values.append({
        spreadsheetId: this.config.spreadsheetId,
        range: `'${resolvedWorksheet}'!A1`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: mappedRows
        }
      });

      this.lastCheckStatus.lastCheckTimestamp = Date.now();
      return { success: true, syncedCount: rows.length };
    } catch (err: any) {
      const sanitized = this.redactError(err.message || String(err));
      this.lastCheckStatus.lastError = sanitized;
      return { success: false, syncedCount: 0, error: sanitized };
    }
  }

  /**
   * Performs an authorized test write to verify end-to-end write permissions
   */
  public async writeTestRecord(): Promise<{ success: boolean; worksheet: string; message: string }> {
    if (!this.config.enabled) {
      return { success: false, worksheet: '', message: 'Google Sheets is currently disabled (GOOGLE_SHEETS_ENABLED=false)' };
    }

    if (!this.sheetsClient) {
      const ok = await this.initialize();
      if (!ok) {
        return { success: false, worksheet: '', message: `Auth/Discovery failed: ${this.lastCheckStatus.lastError}` };
      }
    }

    // Determine safe target worksheet for test
    const candidates = ['SyncMonitoring', 'PlatformEvents', 'MatchResults', 'Users'];
    let targetSheet: string | null = null;

    for (const c of candidates) {
      const resolved = this.resolveWorksheetName(c);
      if (resolved) {
        targetSheet = resolved;
        break;
      }
    }

    if (!targetSheet) {
      // Pick the first discovered sheet if none match
      targetSheet = this.lastCheckStatus.discoveredWorksheets[0] || 'SyncMonitoring';
    }

    const testPayload: Record<string, any> = {
      id: `test-sync-${Date.now()}`,
      eventId: `diag-${Date.now()}`,
      eventType: 'SYSTEM_DIAGNOSTIC_TEST',
      source: 'GoogleSheetsService.testWrite',
      details: 'Automated diagnostic test write to verify Sheets write permissions',
      status: 'VERIFIED_OK',
      itemsSynced: 1,
      retryCount: 0,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    const result = await this.appendRows(targetSheet, [testPayload]);
    if (result.success) {
      return {
        success: true,
        worksheet: targetSheet,
        message: `Successfully verified write access to worksheet "${targetSheet}" in spreadsheet "${this.config.spreadsheetId}"`
      };
    } else {
      return {
        success: false,
        worksheet: targetSheet,
        message: `Write test failed: ${result.error}`
      };
    }
  }

  /**
   * Diagnostic summary safe for public/admin display
   */
  public getDiagnosticStatus(): SheetsDiagnosticStatus {
    return { ...this.lastCheckStatus };
  }

  /**
   * Redacts sensitive strings (private keys, tokens, emails) from error messages
   */
  public redactError(errStr: string): string {
    return errStr
      .replace(/-----BEGIN PRIVATE KEY-----[\s\S]*?-----END PRIVATE KEY-----/gi, '[REDACTED_PRIVATE_KEY]')
      .replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_API_KEY]')
      .replace(/[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g, (email) => {
        const parts = email.split('@');
        return parts[0].slice(0, 3) + '***@' + parts[1];
      });
  }
}

export const googleSheetsService = new GoogleSheetsService();
