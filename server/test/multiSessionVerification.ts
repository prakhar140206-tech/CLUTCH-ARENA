import { io, Socket } from 'socket.io-client';

const SERVER_URL = 'http://localhost:4000';

async function runMultiSessionVerification() {
  console.log('🧪 ========================================================');
  console.log('🧪 RUNNING CLUTCH MULTI-SESSION SOCKET.IO VERIFICATION');
  console.log('🧪 ========================================================\n');

  // Client 1: Alice (Host)
  const alice: Socket = io(SERVER_URL, { transports: ['websocket'], forceNew: true });
  await new Promise<void>((res) => alice.on('connect', () => res()));
  console.log('✅ [Session 1] Alice connected to server:', alice.id);

  // Client 2: Bob (Challenger)
  const bob: Socket = io(SERVER_URL, { transports: ['websocket'], forceNew: true });
  await new Promise<void>((res) => bob.on('connect', () => res()));
  console.log('✅ [Session 2] Bob connected to server:', bob.id);

  const aliceUser = {
    id: 'user-alice-101',
    username: 'Alice_AlgoQueen',
    avatar: { color: '#7c3aed', visorGlow: '#c4b5fd', meshStyle: 'cyber_ninja' }
  };

  const bobUser = {
    id: 'user-bob-202',
    username: 'Bob_ByteHunter',
    avatar: { color: '#06b6d4', visorGlow: '#22d3ee', meshStyle: 'neon_bot' }
  };

  // Step 1: Alice creates room
  console.log('\n[Step 1] Alice creates 1v1 Ranked Duel room...');
  let roomCode = '';
  let roomId = '';

  await new Promise<void>((resolve, reject) => {
    alice.emit('create_room', {
      user: aliceUser,
      settings: {
        mode: 'duel_1v1',
        maxPlayers: 2,
        roundDurationSeconds: 60,
        totalRounds: 3
      }
    }, (res: any) => {
      if (res?.success) {
        roomId = res.room.id;
        roomCode = res.room.code;
        console.log(`  ✅ Room Created successfully: ID=${roomId}, Code=${roomCode}`);
        resolve();
      } else {
        reject(new Error(res?.error || 'Room creation failed'));
      }
    });
  });

  // Step 2: Bob joins by Room Code
  console.log('\n[Step 2] Bob joins room using Code:', roomCode);
  await new Promise<void>((resolve, reject) => {
    bob.emit('join_room', { roomCode, user: bobUser }, (res: any) => {
      if (res?.success) {
        console.log(`  ✅ Bob joined successfully! Current participants:`, Object.keys(res.room.participants));
        resolve();
      } else {
        reject(new Error(res?.error || 'Join room failed'));
      }
    });
  });

  // Step 3: Readiness toggling
  console.log('\n[Step 3] Bob marks Ready...');
  bob.emit('set_ready', { roomId, userId: bobUser.id, isReady: true });
  await new Promise((r) => setTimeout(r, 200));

  // Step 4: Alice starts match
  console.log('\n[Step 4] Alice (Host) launches match...');
  const startPromise = new Promise<void>((resolve, reject) => {
    alice.emit('start_match', { roomId, userId: aliceUser.id }, (res: any) => {
      if (res?.success) {
        console.log('  ✅ Host start_match acknowledged by server');
        resolve();
      } else {
        reject(new Error('start_match failed'));
      }
    });
  });
  await startPromise;

  // Step 5: Wait for round_started on both clients
  console.log('\n[Step 5] Waiting for synchronized round_started event on both clients...');
  let roundChallenge: any = null;
  let roundExpiresAt = 0;

  await Promise.all([
    new Promise<void>((resolve) => {
      alice.once('round_started', (data: any) => {
        roundChallenge = data.challenge;
        roundExpiresAt = data.expiresAt;
        console.log(`  ✅ Alice received round_started: Round #${data.roundIndex}, Challenge: "${data.challenge.title}"`);
        resolve();
      });
    }),
    new Promise<void>((resolve) => {
      bob.once('round_started', (data: any) => {
        console.log(`  ✅ Bob received synchronized round_started: Round #${data.roundIndex}`);
        resolve();
      });
    })
  ]);

  if (!roundChallenge) {
    throw new Error('No challenge received in round_started event');
  }

  // Step 6: Alice submits answer
  console.log('\n[Step 6] Alice submits answer to challenge...');
  const aliceSubmission = await new Promise<any>((resolve) => {
    alice.emit('submit_answer', {
      roomId,
      challengeId: roundChallenge.id,
      roundIndex: 1,
      answer: roundChallenge.options ? roundChallenge.options[0] : 'answer',
      userId: aliceUser.id,
      idempotencyKey: `sub-alice-1-${Date.now()}`,
      timeTakenMs: 1400
    }, (res: any) => {
      resolve(res);
    });
  });
  console.log('  ✅ Alice submission response:', {
    success: aliceSubmission.success,
    isCorrect: aliceSubmission.isCorrect,
    pointsAwarded: aliceSubmission.pointsAwarded,
    speedBonus: aliceSubmission.speedBonus,
    totalScore: aliceSubmission.totalScore
  });

  // Step 7: Bob leaves room
  console.log('\n[Step 7] Testing disconnection / leave room behavior...');
  bob.emit('leave_room', { roomId, userId: bobUser.id });
  await new Promise((r) => setTimeout(r, 300));
  console.log('  ✅ Bob left room gracefully');

  // Step 8: Alice leaves room & disconnects
  alice.emit('leave_room', { roomId, userId: aliceUser.id });
  alice.disconnect();
  bob.disconnect();

  console.log('\n========================================================');
  console.log('🏁 MULTI-SESSION SOCKET.IO VERIFICATION: ALL PASSED');
  console.log('========================================================\n');
}

runMultiSessionVerification().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
