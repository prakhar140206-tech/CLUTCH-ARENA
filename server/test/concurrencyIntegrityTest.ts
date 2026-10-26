import assert from 'assert';
import { persistenceStore, PersistenceStore, hashPassword, verifyPassword } from '../src/storage/db.js';
import { IsolatedExecutionWorker } from '../src/execution/isolatedWorker.js';

function getEventLoopLag(): Promise<number> {
  const start = performance.now();
  return new Promise(resolve => {
    setImmediate(() => {
      resolve(performance.now() - start);
    });
  });
}

async function runConcurrencyIntegritySuite() {
  console.log('========================================================================');
  console.log('🔒 CLUTCH PHASE 5: CONCURRENCY, DATA INTEGRITY & FAIL-CLOSED GATE');
  console.log('========================================================================\n');

  let passed = 0;
  let total = 0;

  async function testStep(name: string, fn: () => Promise<void>) {
    total++;
    try {
      const start = Date.now();
      await fn();
      const elapsed = Date.now() - start;
      console.log(`  ✅ [PASS] ${name} (${elapsed}ms)`);
      passed++;
    } catch (err: any) {
      console.error(`  ❌ [FAIL] ${name}`);
      console.error(`     Error: ${err.message}`);
    }
  }

  // 1. Concurrent Quest Claims
  await testStep('1. Simultaneous Quest Claims: 10 parallel claims for same quest', async () => {
    const testUserId = 'user_concurrent_quest_' + Date.now();
    const testChallengeId = 'challenge_bfs_traversal';

    // Seed test user
    persistenceStore.upsertUser({
      id: testUserId,
      username: 'IntegrityTester',
      auraPoints: 100,
      ratingMMR: 1200
    });

    const initialUser = persistenceStore.getUser(testUserId)!;
    assert.strictEqual(initialUser.auraPoints, 100);
    const initialSolved = initialUser.stats.challengesSolved;

    // Fire 10 parallel claim attempts
    const claimPromises = Array.from({ length: 10 }, () =>
      Promise.resolve().then(() => persistenceStore.claimQuestReward(testUserId, testChallengeId, 50))
    );

    const results = await Promise.all(claimPromises);

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    assert.strictEqual(successCount, 1, `Expected exactly 1 claim to succeed, got ${successCount}`);
    assert.strictEqual(failCount, 9, `Expected 9 claims to be rejected, got ${failCount}`);

    const updatedUser = persistenceStore.getUser(testUserId)!;
    // 50 coins * 10 = 500 aura points
    assert.strictEqual(updatedUser.auraPoints, 600, `Expected 600 aura points, got ${updatedUser.auraPoints}`);
    assert.strictEqual(updatedUser.stats.challengesSolved, initialSolved + 1, 'Challenges solved must increase by exactly 1');
  });

  // 2. Duplicate Match Recording Idempotency
  await testStep('2. Concurrent Match Result Idempotency: Multiple parallel writes with identical match ID', async () => {
    const winnerId = 'user_winner_' + Date.now();
    const matchId = 'match_idempotent_' + Date.now();

    persistenceStore.upsertUser({
      id: winnerId,
      username: 'MatchChampion',
      ratingMMR: 1500
    });

    const initialUser = persistenceStore.getUser(winnerId)!;
    const initialMMR = initialUser.ratingMMR;

    const sampleMatch = {
      id: matchId,
      timestamp: Date.now(),
      mode: 'blitz_1v1',
      durationMs: 45000,
      winner: { id: winnerId, username: 'MatchChampion', score: 350 },
      participantsCount: 2,
      leaderboardSnippet: [{ id: winnerId, username: 'MatchChampion', score: 350, rank: 1 }]
    };

    // Fire 5 concurrent records of the exact same match
    const recordPromises = Array.from({ length: 5 }, () =>
      Promise.resolve().then(() => persistenceStore.recordMatch(sampleMatch))
    );

    const results = await Promise.all(recordPromises);
    const acceptedCount = results.filter(r => r === true).length;
    const rejectedCount = results.filter(r => r === false).length;

    assert.strictEqual(acceptedCount, 1, `Expected exactly 1 match record to be accepted, got ${acceptedCount}`);
    assert.strictEqual(rejectedCount, 4, `Expected 4 duplicate match records to be rejected, got ${rejectedCount}`);

    const updatedUser = persistenceStore.getUser(winnerId)!;
    assert.strictEqual(updatedUser.ratingMMR, initialMMR + 25, `MMR must increase by exactly 25 (once), got ${updatedUser.ratingMMR}`);
    assert.strictEqual(updatedUser.stats.matchesWon, 1, 'Matches won must be exactly 1');
  });

  // 3. Asynchronous Non-blocking Password Hashing under Concurrency
  await testStep('3. Async Scrypt Concurrency & Event Loop Health: 8 concurrent hashes', async () => {
    const passwords = ['ClutchMaster!2026', 'CyberArena#Secure99', 'AlgorithmPro_77', 'ByteKnight$123'];
    const startTime = Date.now();

    // Measure event loop lag concurrently with heavy scrypt hashing
    const lagMeasurements: number[] = [];
    const lagInterval = setInterval(async () => {
      const lag = await getEventLoopLag();
      lagMeasurements.push(lag);
    }, 10);

    const hashPromises = passwords.concat(passwords).map(async (pwd, idx) => {
      const hash = await hashPassword(pwd + idx);
      assert.ok(hash.includes(':'), 'Hash must have salt:key format');
      const verified = await verifyPassword(pwd + idx, hash);
      assert.strictEqual(verified, true, 'Password verification must succeed');
      const wrongVerified = await verifyPassword('WrongPassword', hash);
      assert.strictEqual(wrongVerified, false, 'Wrong password must fail verification');
    });

    await Promise.all(hashPromises);
    clearInterval(lagInterval);

    const maxLag = lagMeasurements.length > 0 ? Math.max(...lagMeasurements) : 0;
    const totalDuration = Date.now() - startTime;
    console.log(`     (Total duration: ${totalDuration}ms, Max event loop lag during scrypt: ${maxLag.toFixed(2)}ms)`);
    assert.ok(maxLag < 100, `Event loop lag should remain below 100ms with async scrypt, got ${maxLag.toFixed(2)}ms`);
  });

  // 4. Production Fail-Closed Readiness: Database unavailable in production
  await testStep('4. Production Database Fail-Closed: Rejects writes and fails readiness without PostgreSQL', async () => {
    const prodStore = new PersistenceStore({
      isProduction: true,
      usePostgres: false,
      ready: false,
      readinessError: 'PostgreSQL connection refused: ECONNREFUSED 127.0.0.1:5432'
    });

    const readiness = prodStore.getReadiness();
    assert.strictEqual(readiness.ready, false, 'Production readiness must be false when PostgreSQL is absent');
    assert.strictEqual(readiness.engine, 'disabled', 'Storage engine must report disabled in production without postgres');
    assert.ok(readiness.error?.includes('PostgreSQL'), 'Readiness error must clearly state PostgreSQL requirement');

    // Authoritative writes must fail closed and throw rather than silently persisting to JSON
    let threwOnWrite = false;
    try {
      prodStore.upsertUser({ id: 'unauthorized_write', username: 'TestProdFail' });
    } catch (err: any) {
      threwOnWrite = true;
      assert.ok(err.message.includes('DatabaseUnavailable'), `Expected DatabaseUnavailable error, got ${err.message}`);
    }
    assert.strictEqual(threwOnWrite, true, 'Authoritative write must throw DatabaseUnavailable error in production');
  });

  // 5. Production Isolated Worker Fail-Closed: Never silently fallback to host execution
  await testStep('5. Execution Worker Fail-Closed: Never falls back to host execution when isolation required', async () => {
    const oldEnv = process.env.ENFORCE_CONTAINER_SANDBOX;
    process.env.ENFORCE_CONTAINER_SANDBOX = 'true';

    try {
      const strictWorker = new IsolatedExecutionWorker();
      const status = strictWorker.getIsolationStatus();

      // In this environment without docker, the worker must safely report 'disabled'
      if (!status.dockerAvailable) {
        assert.strictEqual(status.mode, 'disabled', 'Isolation mode must be disabled when docker unavailable and container enforced');

        const result = await strictWorker.executeSubmission(
          'python',
          'print("Hello untrusted code")',
          [{ id: '1', input: '', expectedOutput: 'Hello untrusted code' }]
        );

        assert.strictEqual(result.overallStatus, 'SANDBOX_ISOLATION_REQUIRED');
        assert.strictEqual(result.allPassed, false);
        assert.ok(result.testResults[0].error.includes('Security Boundary Notice'));
      }
    } finally {
      if (oldEnv === undefined) {
        delete process.env.ENFORCE_CONTAINER_SANDBOX;
      } else {
        process.env.ENFORCE_CONTAINER_SANDBOX = oldEnv;
      }
    }
  });

  console.log('\n------------------------------------------------------------------------');
  console.log(`SUMMARY: ${passed}/${total} Concurrency, Data Integrity & Security Gates Passed.`);
  console.log('------------------------------------------------------------------------\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runConcurrencyIntegritySuite().catch(err => {
  console.error('Fatal Test Suite Error:', err);
  process.exit(1);
});
