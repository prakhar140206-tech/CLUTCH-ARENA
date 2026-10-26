import assert from 'assert';
import { GoogleSheetsService } from '../src/sheets/googleSheetsService.js';
import { SheetsSyncWorker } from '../src/sheets/sheetsSyncWorker.js';
import { persistenceStore } from '../src/storage/db.js';
import { secureTimingSafeCompare } from '../src/config/securityConfig.js';

async function runGoogleSheetsTestSuite() {
  console.log('📊 ===============================================');
  console.log('📊 GOOGLE SHEETS LIVE PLATFORM SYNC TEST SUITE');
  console.log('📊 ===============================================\n');

  let passed = 0;
  let total = 0;

  async function test(name: string, fn: () => void | Promise<void>) {
    total++;
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ❌ [FAIL] ${name}:`, err.message);
    }
  }

  // 1. Safe Failure & Diagnostic Status
  await test('Safe Failure: Service fails gracefully when disabled or unconfigured', async () => {
    const service = new GoogleSheetsService({
      enabled: false,
      spreadsheetId: ''
    });
    const initialized = await service.initialize();
    assert.strictEqual(initialized, false);
    const diag = service.getDiagnosticStatus();
    assert.strictEqual(diag.enabled, false);
    assert.strictEqual(diag.authenticated, false);
    assert.strictEqual(diag.accessible, false);
    assert.ok(diag.lastError !== null);
  });

  // 2. Secret Redaction
  await test('Secret Protection: Redacts private keys, tokens, and emails in logs', () => {
    const service = new GoogleSheetsService();
    const fakeKey = '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----';
    const fakeError = `Failed to connect with key: ${fakeKey} and api key AIzaSyD12345678901234567890123456789012 for user pilot@clutch.arena`;
    const redacted = service.redactError(fakeError);
    assert.ok(!redacted.includes('BEGIN PRIVATE KEY'));
    assert.ok(redacted.includes('[REDACTED_PRIVATE_KEY]'));
    assert.ok(redacted.includes('[REDACTED_API_KEY]'));
    assert.ok(!redacted.includes('pilot@clutch.arena'));
  });

  // 3. Dynamic Worksheet & Column Header Mapping for all 7 Worksheets
  await test('Dynamic Mapping: Users worksheet column order & fuzzy headers', () => {
    const service = new GoogleSheetsService();
    // Simulate user's arbitrary existing headers in row 1
    (service as any).worksheetCache.set('Users', ['Player ID', 'Username', 'Email', 'Rank Tier', 'Aura Points', 'Aura Title', 'Joined Date']);

    const userRecord = {
      id: 'usr-1001',
      username: 'CyberNinja',
      email: 'ninja@clutch.arena',
      rankTier: 'Diamond V',
      auraPoints: 8500,
      auraTitle: 'Apex Solver',
      createdAt: '2026-10-27T00:00:00.000Z'
    };

    const row = service.mapRecordToHeaders('Users', userRecord);
    assert.strictEqual(row[0], 'usr-1001');
    assert.strictEqual(row[1], 'CyberNinja');
    assert.strictEqual(row[2], 'ninja@clutch.arena');
    assert.strictEqual(row[3], 'Diamond V');
    assert.strictEqual(row[4], 8500);
    assert.strictEqual(row[5], 'Apex Solver');
    assert.strictEqual(row[6], '2026-10-27T00:00:00.000Z');
  });

  await test('Dynamic Mapping: MatchResults worksheet authoritative mapping', () => {
    const service = new GoogleSheetsService();
    (service as any).worksheetCache.set('MatchResults', ['matchId', 'mode', 'durationSeconds', 'winnerUsername', 'winnerScore', 'participantsCount', 'timestamp']);

    const matchRecord = {
      matchId: 'match-xyz-789',
      mode: 'duel_1v1',
      durationSeconds: 600,
      winnerId: 'usr-1001',
      winnerUsername: 'CyberNinja',
      winnerScore: 450,
      participantsCount: 2,
      timestamp: '2026-10-27T01:00:00.000Z'
    };

    const row = service.mapRecordToHeaders('MatchResults', matchRecord);
    assert.strictEqual(row[0], 'match-xyz-789');
    assert.strictEqual(row[1], 'duel_1v1');
    assert.strictEqual(row[2], 600);
    assert.strictEqual(row[3], 'CyberNinja');
    assert.strictEqual(row[4], 450);
    assert.strictEqual(row[5], 2);
    assert.strictEqual(row[6], '2026-10-27T01:00:00.000Z');
  });

  await test('Dynamic Mapping: CustomRooms worksheet lifecycle mapping', () => {
    const service = new GoogleSheetsService();
    (service as any).worksheetCache.set('CustomRooms', ['Room ID', 'Room Code', 'Host Callsign', 'Mode', 'Max Capacity', 'Status', 'Created At']);

    const roomRecord = {
      roomId: 'room-alpha-1',
      code: 'CLUTCH',
      hostUsername: 'HostPilot',
      mode: 'last_brain_standing',
      maxPlayers: 8,
      status: 'in_round',
      createdAt: '2026-10-27T02:00:00.000Z'
    };

    const row = service.mapRecordToHeaders('CustomRooms', roomRecord);
    assert.strictEqual(row[0], 'room-alpha-1');
    assert.strictEqual(row[1], 'CLUTCH');
    assert.strictEqual(row[2], 'HostPilot');
    assert.strictEqual(row[3], 'last_brain_standing');
    assert.strictEqual(row[4], 8);
    assert.strictEqual(row[5], 'in_round');
    assert.strictEqual(row[6], '2026-10-27T02:00:00.000Z');
  });

  await test('Dynamic Mapping: QuestionAttempts validated submission mapping', () => {
    const service = new GoogleSheetsService();
    (service as any).worksheetCache.set('QuestionAttempts', ['Submission ID', 'Room ID', 'Round', 'Pilot', 'Topic', 'Difficulty', 'Correct', 'Points', 'Time (ms)']);

    const attemptRecord = {
      submissionId: 'sub-999',
      roomId: 'room-alpha-1',
      roundIndex: 2,
      username: 'CodeNinja',
      challengeId: 'q-arr-01',
      topic: 'arrays_and_strings',
      difficulty: 'medium',
      isCorrect: true,
      pointsAwarded: 135,
      timeTakenMs: 4200
    };

    const row = service.mapRecordToHeaders('QuestionAttempts', attemptRecord);
    assert.strictEqual(row[0], 'sub-999');
    assert.strictEqual(row[1], 'room-alpha-1');
    assert.strictEqual(row[2], 2);
    assert.strictEqual(row[3], 'CodeNinja');
    assert.strictEqual(row[4], 'arrays_and_strings');
    assert.strictEqual(row[5], 'medium');
    assert.strictEqual(row[6], true);
    assert.strictEqual(row[7], 135);
    assert.strictEqual(row[8], 4200);
  });

  await test('Dynamic Mapping: Progress topic mastery progression mapping', () => {
    const service = new GoogleSheetsService();
    (service as any).worksheetCache.set('Progress', ['User ID', 'Pilot', 'Topic', 'Mastery Score', 'Difficulty', 'Attempted', 'Solved', 'Accuracy']);

    const progressRecord = {
      userId: 'usr-1001',
      username: 'CodeNinja',
      topic: 'dynamic_programming',
      masteryScore: 82,
      currentDifficulty: 'hard',
      questionsAttempted: 20,
      questionsSolved: 17,
      recentAccuracy: 85.0
    };

    const row = service.mapRecordToHeaders('Progress', progressRecord);
    assert.strictEqual(row[0], 'usr-1001');
    assert.strictEqual(row[1], 'CodeNinja');
    assert.strictEqual(row[2], 'dynamic_programming');
    assert.strictEqual(row[3], 82);
    assert.strictEqual(row[4], 'hard');
    assert.strictEqual(row[5], 20);
    assert.strictEqual(row[6], 17);
    assert.strictEqual(row[7], 85.0);
  });

  await test('Dynamic Mapping: PlatformEvents and SyncMonitoring mapping', () => {
    const service = new GoogleSheetsService();
    (service as any).worksheetCache.set('PlatformEvents', ['Event ID', 'Event Type', 'Source', 'Details', 'Timestamp']);
    (service as any).worksheetCache.set('SyncMonitoring', ['ID', 'Timestamp', 'Worksheet', 'Items Synced', 'Status']);

    const eventRecord = {
      eventId: 'evt-001',
      eventType: 'SERVER_BOOT',
      source: 'CLUTCH_CORE',
      details: 'Started on port 4000',
      timestamp: '2026-10-27T02:30:00.000Z'
    };

    const monRecord = {
      id: 'mon-001',
      timestamp: '2026-10-27T02:30:05.000Z',
      worksheet: 'Users',
      itemsSynced: 5,
      status: 'SUCCESS'
    };

    const eventRow = service.mapRecordToHeaders('PlatformEvents', eventRecord);
    assert.strictEqual(eventRow[0], 'evt-001');
    assert.strictEqual(eventRow[1], 'SERVER_BOOT');

    const monRow = service.mapRecordToHeaders('SyncMonitoring', monRecord);
    assert.strictEqual(monRow[0], 'mon-001');
    assert.strictEqual(monRow[3], 5);
    assert.strictEqual(monRow[4], 'SUCCESS');
  });

  // 4. Durable Outbox Queue Operations & Persistence
  await test('Durable Outbox: Enqueues and retrieves pending records with idempotency', async () => {
    const testId = `test_outbox_${Date.now()}`;
    await persistenceStore.enqueueSheetsOutbox({
      id: testId,
      worksheet: 'Users',
      rowData: { id: 'usr-test', username: 'TestUser' }
    });

    // Enqueueing identical ID must not duplicate (idempotency check)
    await persistenceStore.enqueueSheetsOutbox({
      id: testId,
      worksheet: 'Users',
      rowData: { id: 'usr-test', username: 'TestUser' }
    });

    const pending = await persistenceStore.fetchPendingSheetsOutbox(100);
    const matches = pending.filter(r => r.id === testId);
    assert.strictEqual(matches.length, 1);
    assert.strictEqual(matches[0].status, 'pending');
    assert.strictEqual(matches[0].worksheet, 'Users');

    // Status transition: mark as synced
    await persistenceStore.updateSheetsOutboxStatus(testId, 'synced');
    const remainingPending = await persistenceStore.fetchPendingSheetsOutbox(100);
    assert.strictEqual(remainingPending.some(r => r.id === testId), false);
  });

  // 5. Retry with Exponential Backoff
  await test('Outbox Retries: Failed sync increments retry count and stores error', async () => {
    const retryTestId = `retry_test_${Date.now()}`;
    await persistenceStore.enqueueSheetsOutbox({
      id: retryTestId,
      worksheet: 'MatchResults',
      rowData: { matchId: 'm-retry-1', winner: 'Player1' }
    });

    // Mark as failed
    await persistenceStore.updateSheetsOutboxStatus(retryTestId, 'failed', 'Google Sheets API 503 Backend Unavailable');

    const pending = await persistenceStore.fetchPendingSheetsOutbox(100);
    const item = pending.find(r => r.id === retryTestId);
    assert.ok(item !== undefined);
    assert.strictEqual(item!.status, 'failed');
    assert.strictEqual(item!.retryCount, 1);
    assert.ok(item!.lastError?.includes('503'));

    // Clean up
    await persistenceStore.updateSheetsOutboxStatus(retryTestId, 'synced');
  });

  // 6. Security Authorization Check
  await test('Security Guard: Diagnostic operations require constant-time admin authorization', () => {
    const validKey = 'my_secret_admin_key_2026';
    assert.strictEqual(secureTimingSafeCompare('my_secret_admin_key_2026', validKey), true);
    assert.strictEqual(secureTimingSafeCompare('wrong_key', validKey), false);
    assert.strictEqual(secureTimingSafeCompare(undefined, validKey), false);
    assert.strictEqual(secureTimingSafeCompare('', validKey), false);
  });

  console.log(`\n📊 RESULTS: ${passed}/${total} TESTS PASSED\n`);
  if (passed !== total) {
    throw new Error(`${total - passed} tests failed in Google Sheets test suite`);
  }
}

runGoogleSheetsTestSuite().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
