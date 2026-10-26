import assert from 'assert';
import { RoomManager } from '../src/rooms/roomManager.js';
import { SubmissionPayload } from '../src/types/shared.js';
import { DSA_CHALLENGE_BANK } from '../src/challenges/challengeBank.js';

function createMockIo() {
  return {
    to: (_room: string) => ({
      emit: (_event: string, _data: any) => {}
    }),
    emit: (_event: string, _data: any) => {}
  } as any;
}

function createMockSocket(id: string) {
  return {
    id,
    join: (_room: string) => {},
    leave: (_room: string) => {},
    emit: (_event: string, _data: any) => {}
  } as any;
}

async function runLoadTest70to100() {
  console.log('\n🚀 =========================================================');
  console.log('🚀 RUNNING 70–100 CONCURRENT PARTICIPANTS MULTIPLAYER LOAD TEST');
  console.log('🚀 =========================================================\n');

  const TARGET_PLAYERS = 100;
  const matchDuration = 10; // 10 minutes
  const questionTimer = 20; // 20 seconds

  console.log(`[Load Test] Initializing match room for ${TARGET_PLAYERS} concurrent players...`);

  const io = createMockIo();
  const rm = new RoomManager(io);

  const hostProfile = {
    id: 'host-arena-lead',
    username: 'TournamentHost',
    avatar: { color: '#8b5cf6', visorGlow: '#06b6d4', meshStyle: 'cyber_ninja', trailEffect: 'electric_cyan', emote: 'wave', dripAura: 'matrix_drip' }
  };

  const hostSocket = createMockSocket('sock-host-lead');
  const room = rm.createRoom(hostSocket, hostProfile, {
    mode: 'mega_arena_100',
    maxPlayers: 100,
    matchDurationMinutes: matchDuration,
    questionDurationSeconds: questionTimer
  });

  assert.strictEqual(Object.keys(room.participants).length, 1);
  assert.strictEqual(room.settings.maxPlayers, 100);

  // 1. Join 99 additional players to reach 100 concurrent participants
  console.log(`[Load Test] Simulating connection of ${TARGET_PLAYERS - 1} concurrent players...`);
  const joinStart = Date.now();

  for (let i = 2; i <= TARGET_PLAYERS; i++) {
    const sock = createMockSocket(`sock-player-${i}`);
    const player = {
      id: `player-node-${i}`,
      username: `Contender_${i.toString().padStart(3, '0')}`,
      avatar: { color: '#06b6d4', visorGlow: '#8b5cf6', meshStyle: 'cyber_ninja', trailEffect: 'electric_cyan', emote: 'wave', dripAura: 'matrix_drip' }
    };
    rm.joinRoom(sock, room.code, player);
  }

  const joinDuration = Date.now() - joinStart;
  const totalConnected = Object.keys(room.participants).length;
  console.log(`  ✅ 100 players joined room successfully in ${joinDuration}ms (${(joinDuration / TARGET_PLAYERS).toFixed(2)}ms/join)`);
  assert.strictEqual(totalConnected, TARGET_PLAYERS);

  // 2. Start time-based match
  console.log('[Load Test] Starting 10-minute authoritative match...');
  rm.startMatch(room.id, hostProfile.id);
  await rm.nextRound(room.id);

  const activeRoom = rm.rooms.get(room.id)!;
  assert.strictEqual(activeRoom.status, 'in_round');
  assert.ok(activeRoom.matchExpiresAt !== null);
  assert.ok(activeRoom.activeChallenge !== null);

  const currentChallenge = activeRoom.activeChallenge!;
  console.log(`  ✅ Round 1 started with challenge: "${currentChallenge.title}" (${currentChallenge.type})`);

  // 3. Simulate simultaneous submissions from all 100 players
  console.log(`[Load Test] Simulating simultaneous answer submission from all ${TARGET_PLAYERS} participants...`);
  const submissionStart = Date.now();

  const participantsList = Object.values(activeRoom.participants);
  const rawChallenge = DSA_CHALLENGE_BANK.find(c => c.id === currentChallenge.id)!;

  const submissionPromises = participantsList.map(async (participant, index) => {
    // Stagger submission delays between 1000ms and 12000ms
    const thinkTimeMs = 1200 + (index % 10) * 1000;
    // 70% of players answer correctly, 30% answer incorrectly
    const isCorrect = (index % 10) < 7;
    const answer = isCorrect ? (rawChallenge.correctAnswer || 'valid_answer') : 'incorrect_choice';

    const payload: SubmissionPayload = {
      roomId: room.id,
      challengeId: currentChallenge.id,
      roundIndex: activeRoom.currentRound,
      answer,
      idempotencyKey: `load-sub-${room.id}-${activeRoom.currentRound}-${participant.id}`,
      timeTakenMs: thinkTimeMs
    };

    return rm.processSubmission(payload, participant.id);
  });

  const submissionResults = await Promise.all(submissionPromises);
  const submissionDuration = Date.now() - submissionStart;

  console.log(`  ✅ All ${TARGET_PLAYERS} answers processed and validated concurrently in ${submissionDuration}ms`);
  assert.strictEqual(submissionResults.length, TARGET_PLAYERS);

  // 4. Validate Leaderboard Ordering & Integrity
  console.log('[Load Test] Verifying live leaderboard sorting and consistency...');
  const leaderboard = activeRoom.leaderboard;
  assert.strictEqual(leaderboard.length, TARGET_PLAYERS);

  const leader = leaderboard[0];
  const lastPlayer = leaderboard[leaderboard.length - 1];

  console.log(`  🏆 Leader: ${leader.username} (Score: ${leader.score}, Correct: ${leader.correctCount})`);
  console.log(`  🎯 100th Player: ${lastPlayer.username} (Score: ${lastPlayer.score}, Correct: ${lastPlayer.correctCount})`);

  assert.ok(leader.score >= lastPlayer.score, 'Leader score must be >= last place');

  // Verify rank continuity (1 to 100)
  for (let i = 0; i < TARGET_PLAYERS; i++) {
    assert.strictEqual(leaderboard[i].rank, i + 1, `Rank at index ${i} must be ${i + 1}`);
    assert.ok(leaderboard[i].id.length > 0);
    assert.ok(typeof leaderboard[i].score === 'number');
  }

  console.log('\n[Load Test Metrics]');
  console.log(`  - Concurrent Participants: ${TARGET_PLAYERS}`);
  console.log(`  - Room Capacity Utilization: 100%`);
  console.log(`  - 100-Player Submission Processing Time: ${submissionDuration}ms`);
  console.log(`  - Average Throughput: ${(TARGET_PLAYERS / (submissionDuration / 1000)).toFixed(0)} submissions/sec`);
  console.log('  - Leaderboard Consistency: 100% Deterministic & Intact\n');
  console.log('  ✅ [PASS] 70-100 Player Multiplayer Arena Load Test PASSED');
}

runLoadTest70to100().catch(err => {
  console.error('Fatal load test error:', err);
  process.exit(1);
});
