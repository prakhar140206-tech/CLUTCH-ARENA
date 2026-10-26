import assert from 'assert';
import { RoomManager } from '../src/rooms/roomManager.js';
import { ScoringEngine } from '../src/game/scoringEngine.js';
import { MatchDurationMinutes, PerQuestionSeconds, SubmissionPayload } from '../src/types/shared.js';
import { DSA_CHALLENGE_BANK } from '../src/challenges/challengeBank.js';

// Mock Socket.IO server and sockets for high-speed in-memory testing
function createMockIo() {
  const io: any = {
    to: (_room: string) => ({
      emit: (_event: string, _data: any) => {}
    }),
    emit: (_event: string, _data: any) => {}
  };
  return io;
}

function createMockSocket(id: string) {
  const socket: any = {
    id,
    join: (_room: string) => {},
    leave: (_room: string) => {},
    emit: (_event: string, _data: any) => {}
  };
  return socket;
}

async function runTimeBasedEndlessTests() {
  console.log('\n⏱️ =========================================================');
  console.log('⏱️ RUNNING TIME-BASED ENDLESS GAMEPLAY & TIMER INTEGRITY TESTS');
  console.log('⏱️ =========================================================\n');

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

  const hostUser = { id: 'pilot-alpha-1', username: 'AlphaLead' };
  const player2User = { id: 'pilot-beta-2', username: 'BetaRival' };

  // TEST 1: All 4 Supported Durations Configurable
  await test('RoomManager supports all 4 configured durations (10, 15, 25, 30 mins)', () => {
    const io = createMockIo();
    const rm = new RoomManager(io);
    const durations: MatchDurationMinutes[] = [10, 15, 25, 30];

    for (const d of durations) {
      const sock = createMockSocket(`sock-host-${d}`);
      const room = rm.createRoom(sock, hostUser, {
        mode: 'duel_1v1',
        matchDurationMinutes: d,
        questionDurationSeconds: 20
      });
      assert.strictEqual(room.settings.matchDurationMinutes, d);
      assert.strictEqual(room.settings.questionDurationSeconds, 20);
      assert.strictEqual(room.settings.totalRounds, 9999, 'Matches must not be capped by fixed rounds');
    }
  });

  // TEST 2: Authoritative Timers Set Upon Match Start
  await test('Authoritative matchExpiresAt and questionExpiresAt set on startMatch', async () => {
    const io = createMockIo();
    const rm = new RoomManager(io);
    const sock = createMockSocket('sock-start-1');
    const room = rm.createRoom(sock, hostUser, {
      mode: 'duel_1v1',
      matchDurationMinutes: 15,
      questionDurationSeconds: 15
    });

    const now = Date.now();
    rm.startMatch(room.id, hostUser.id);
    const started = rm.rooms.get(room.id)!;

    assert.ok(started.matchExpiresAt !== null);
    // 15 minutes = 900,000ms + 3,000ms pre-round countdown
    const expectedMatchExpiry = now + 3000 + 15 * 60 * 1000;
    assert.ok(Math.abs(started.matchExpiresAt! - expectedMatchExpiry) < 3000, 'Match expiry must match authoritative duration');

    // Trigger next round to check question timer
    await rm.nextRound(room.id);
    assert.ok(started.questionExpiresAt !== null);
    const expectedQuestionExpiry = now + 15 * 1000;
    assert.ok(Math.abs(started.questionExpiresAt! - expectedQuestionExpiry) < 3000, 'Question expiry must match authoritative question timer');
  });

  // TEST 3: Endless Question Progression without premature termination
  await test('Endless loop delivers next question without stopping at round 3 or 5', async () => {
    const io = createMockIo();
    const rm = new RoomManager(io);
    const sock = createMockSocket('sock-endless-1');
    const room = rm.createRoom(sock, hostUser, {
      mode: 'solo_quest',
      matchDurationMinutes: 25,
      questionDurationSeconds: 20
    });
    rm.startMatch(room.id, hostUser.id);

    // Simulate answering 8 consecutive rounds
    for (let round = 1; round <= 8; round++) {
      await rm.nextRound(room.id);
      const active = rm.rooms.get(room.id)!;
      assert.strictEqual(active.status, 'in_round');
      assert.strictEqual(active.currentRound, round);
      assert.ok(active.activeChallenge !== null, `Round ${round} must have a verified challenge`);
    }
  });

  // TEST 4: Late Submission Rejection (After question deadline)
  await test('Late submission after questionExpiresAt is rejected or awarded 0 points', async () => {
    const io = createMockIo();
    const rm = new RoomManager(io);
    const sock = createMockSocket('sock-late-1');
    const room = rm.createRoom(sock, hostUser, {
      mode: 'duel_1v1',
      matchDurationMinutes: 10,
      questionDurationSeconds: 20
    });
    rm.startMatch(room.id, hostUser.id);
    await rm.nextRound(room.id);

    const active = rm.rooms.get(room.id)!;
    const challenge = active.activeChallenge!;

    // Case A: Submission within 15 seconds is valid
    const onTimeScore = ScoringEngine.calculateScore({
      challenge: DSA_CHALLENGE_BANK[0],
      isCorrect: true,
      timeTakenMs: 4000,
      currentCombo: 0
    });
    assert.strictEqual(onTimeScore.isCorrect, true);
    assert.ok(onTimeScore.pointsAwarded >= 100);

    // Case B: Submission exceeding time limit + grace period
    const expiredTimeMs = 30000; // > 25s + 2s grace
    const lateScore = ScoringEngine.calculateScore({
      challenge: DSA_CHALLENGE_BANK[0],
      isCorrect: true,
      timeTakenMs: expiredTimeMs,
      currentCombo: 0
    });
    assert.strictEqual(lateScore.pointsAwarded, 0, 'Late submissions must yield 0 points');
  });

  // TEST 5: Duplicate and Concurrent Submission Idempotency
  await test('Duplicate submissions in the same round do not double-score', async () => {
    const io = createMockIo();
    const rm = new RoomManager(io);
    const sock1 = createMockSocket('sock-dup-1');
    const sock2 = createMockSocket('sock-dup-2');

    const room = rm.createRoom(sock1, hostUser, {
      mode: 'duel_1v1',
      matchDurationMinutes: 10,
      questionDurationSeconds: 20
    });
    rm.joinRoom(sock2, room.code, player2User);
    rm.startMatch(room.id, hostUser.id);
    await rm.nextRound(room.id);

    const payload: SubmissionPayload = {
      roomId: room.id,
      challengeId: room.activeChallenge!.id,
      roundIndex: room.currentRound,
      answer: 'test_answer',
      idempotencyKey: `idem-${room.id}-${room.currentRound}-${hostUser.id}`,
      timeTakenMs: 4000
    };

    // First submission
    const res1 = await rm.processSubmission(payload, hostUser.id, sock1);
    const scoreAfterFirst = rm.rooms.get(room.id)!.participants[hostUser.id].score;

    // Duplicate submission in same round
    const res2 = await rm.processSubmission(payload, hostUser.id, sock1);
    const scoreAfterSecond = rm.rooms.get(room.id)!.participants[hostUser.id].score;

    assert.strictEqual(scoreAfterFirst, scoreAfterSecond, 'Duplicate submissions must be idempotent');
  });

  // TEST 6: Match Finalization When Authoritative Time Expires
  await test('Match finalizes immediately when match deadline is reached', async () => {
    const io = createMockIo();
    const rm = new RoomManager(io);
    const sock = createMockSocket('sock-fin-1');
    const room = rm.createRoom(sock, hostUser, {
      mode: 'duel_1v1',
      matchDurationMinutes: 10,
      questionDurationSeconds: 20
    });
    rm.startMatch(room.id, hostUser.id);

    // Manually force match expiry into past to simulate clock expiration
    room.matchExpiresAt = Date.now() - 1000;

    // Attempting next round after deadline finalizes match
    await rm.nextRound(room.id);
    assert.strictEqual(room.status, 'match_ended', 'Room status must be match_ended');
  });

  // TEST 7: Deterministic Leaderboard Sorting: Score > Correct Answers > Total Time
  await test('Deterministic leaderboard resolution: Score > Correct Answers > Total Time', () => {
    const io = createMockIo();
    const rm = new RoomManager(io);
    const sock1 = createMockSocket('sock-rank-1');
    const sock2 = createMockSocket('sock-rank-2');

    const room = rm.createRoom(sock1, hostUser, {
      mode: 'duel_1v1',
      matchDurationMinutes: 10,
      questionDurationSeconds: 20
    });
    rm.joinRoom(sock2, room.code, player2User);

    // Simulate identical scores and correct answers, but player 1 was faster overall
    const p1 = room.participants[hostUser.id];
    const p2 = room.participants[player2User.id];

    p1.score = 500;
    p1.correctAnswers = 4;
    p1.totalTimeTakenMs = 18500; // Faster

    p2.score = 500;
    p2.correctAnswers = 4;
    p2.totalTimeTakenMs = 24000; // Slower

    rm.updateLeaderboard(room.id);
    const leaderboard = rm.rooms.get(room.id)!.leaderboard;

    assert.strictEqual(leaderboard[0].id, hostUser.id, 'Faster total response time must rank 1st in tiebreak');
    assert.strictEqual(leaderboard[1].id, player2User.id, 'Slower player must rank 2nd');
  });

  console.log(`\nResults: ${passed}/${total} tests passed.\n`);
  if (passed !== total) process.exit(1);
}

runTimeBasedEndlessTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
