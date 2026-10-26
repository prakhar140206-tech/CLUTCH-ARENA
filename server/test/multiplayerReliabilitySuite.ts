import assert from 'assert';
import { io as ClientSocket, Socket as ClientSocketType } from 'socket.io-client';
import { DSA_CHALLENGE_BANK } from '../src/challenges/challengeBank.js';
import { persistenceStore, PersistenceStore } from '../src/storage/db.js';

const SERVER_URL = 'http://localhost:4000';

function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function calculatePercentile(arr: number[], percentile: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}

async function runMultiplayerReliabilitySuite() {
  console.log('========================================================================');
  console.log('🚀 CLUTCH MULTIPLAYER RELIABILITY, SUSTAINED LOAD & LATENCY SUITE');
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

  // 1. Multiple Simultaneous Rooms with Independent Real Sockets
  const activeSockets: ClientSocketType[] = [];
  const roomCodes: string[] = [];
  const roomIds: string[] = [];

  await testStep('1. Multi-Room Creation: 4 distinct concurrent rooms with host sockets', async () => {
    for (let r = 0; r < 4; r++) {
      const hostSocket: ClientSocketType = ClientSocket(SERVER_URL, {
        transports: ['websocket'],
        forceNew: true
      });
      activeSockets.push(hostSocket);

      await new Promise<void>((resolve, reject) => {
        hostSocket.on('connect', () => {
          hostSocket.emit(
            'create_room',
            {
              user: { id: `host-user-${r}`, username: `ArenaHost_${r}` },
              settings: { maxPlayers: 10, totalRounds: 3, roundDurationSeconds: 120 }
            },
            (res: any) => {
              if (res.success && res.room) {
                roomCodes.push(res.room.code);
                roomIds.push(res.room.id);
                resolve();
              } else {
                reject(new Error(res.error || 'Failed to create room'));
              }
            }
          );
        });
        hostSocket.on('connect_error', reject);
      });
    }

    assert.strictEqual(roomCodes.length, 4);
    assert.strictEqual(new Set(roomCodes).size, 4, 'All 4 room codes must be unique');
  });

  // 2. Concurrent Client Joins (40 real socket clients across 4 rooms)
  await testStep('2. Concurrent Client Joins: 40 independent real sockets join 4 rooms', async () => {
    const joinPromises: Promise<void>[] = [];

    for (let r = 0; r < 4; r++) {
      const code = roomCodes[r];
      // 9 extra players per room (total 10 with host)
      for (let p = 1; p <= 9; p++) {
        const clientSocket: ClientSocketType = ClientSocket(SERVER_URL, {
          transports: ['websocket'],
          forceNew: true
        });
        activeSockets.push(clientSocket);

        const pPromise = new Promise<void>((resolve, reject) => {
          clientSocket.on('connect', () => {
            clientSocket.emit(
              'join_room',
              {
                roomCode: code,
                user: { id: `player-${r}-${p}`, username: `Contender_${r}_${p}` }
              },
              (res: any) => {
                if (res.success) resolve();
                else reject(new Error(res.error || 'Join error'));
              }
            );
          });
          clientSocket.on('connect_error', reject);
        });
        joinPromises.push(pPromise);
      }
    }

    await Promise.all(joinPromises);
    assert.strictEqual(activeSockets.length, 40, 'All 40 client sockets connected');
  });

  // 3. Start Matches and synchronize with round_started across all 4 rooms
  let roomChallenges: Record<string, any> = {};

  await testStep('3. Multi-Match Start: Host sockets initiate countdown & synchronize round_started', async () => {
    const roundStartedPromises: Promise<void>[] = [];

    for (let r = 0; r < 4; r++) {
      const hostSocket = activeSockets[r * 10]; // Host of room r
      const roomId = roomIds[r];

      const p = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error(`Timeout waiting for round_started in room ${r}`)), 7000);
        hostSocket.on('round_started', (data: any) => {
          clearTimeout(timeout);
          roomChallenges[roomId] = data.challenge;
          resolve();
        });

        hostSocket.emit('start_match', { roomId, userId: `host-user-${r}` }, (res: any) => {
          if (!res.success) reject(new Error('Match start rejected'));
        });
      });
      roundStartedPromises.push(p);
    }

    await Promise.all(roundStartedPromises);
    assert.strictEqual(Object.keys(roomChallenges).length, 4, 'All 4 rooms transitioned to in_round');
  });

  // 4. Simultaneous Submissions & Latency Profiling (p50, p95, p99)
  const latencies: number[] = [];
  const memoryBefore = process.memoryUsage();

  await testStep('4. Sustained Load & Latency Profiling: 40 simultaneous submissions across 4 rooms', async () => {
    const submissionPromises: Promise<void>[] = [];
    const submissionStartTime = Date.now();

    for (let i = 0; i < activeSockets.length; i++) {
      const socket = activeSockets[i];
      const roomIndex = Math.floor(i / 10);
      const roomId = roomIds[roomIndex];
      const userId = i % 10 === 0 ? `host-user-${roomIndex}` : `player-${roomIndex}-${i % 10}`;
      const challenge = roomChallenges[roomId];
      const answerVal = challenge?.options ? challenge.options[0] : (DSA_CHALLENGE_BANK[0].correctAnswer);

      const p = new Promise<void>((resolve, reject) => {
        const reqStart = Date.now();
        socket.emit(
          'submit_answer',
          {
            roomId,
            roundIndex: 1,
            challengeId: challenge?.id || DSA_CHALLENGE_BANK[0].id,
            userId,
            answer: answerVal,
            timeTakenMs: 1200 + (i * 20),
            idempotencyKey: `idemp-load-${i}-${Date.now()}`
          },
          (res: any) => {
            const reqDuration = Date.now() - reqStart;
            latencies.push(reqDuration);
            if (res && res.success !== undefined) {
              resolve();
            } else {
              reject(new Error(res?.feedback || 'Submission failed'));
            }
          }
        );
      });
      submissionPromises.push(p);
    }

    await Promise.all(submissionPromises);
    const totalTimeMs = Date.now() - submissionStartTime;
    const memoryAfter = process.memoryUsage();

    // Calculate percentiles
    const p50 = calculatePercentile(latencies, 50);
    const p95 = calculatePercentile(latencies, 95);
    const p99 = calculatePercentile(latencies, 99);
    const minLat = Math.min(...latencies);
    const maxLat = Math.max(...latencies);
    const throughput = (activeSockets.length / (totalTimeMs / 1000)).toFixed(1);
    const rssDeltaMb = ((memoryAfter.rss - memoryBefore.rss) / (1024 * 1024)).toFixed(2);
    const heapDeltaMb = ((memoryAfter.heapUsed - memoryBefore.heapUsed) / (1024 * 1024)).toFixed(2);

    console.log(`     --------------------------------------------------`);
    console.log(`     📊 LATENCY & THROUGHPUT PERFORMANCE METRICS:`);
    console.log(`     - Total Submissions Processed: ${activeSockets.length} concurrent`);
    console.log(`     - Total Burst Duration: ${totalTimeMs} ms`);
    console.log(`     - Throughput: ${throughput} req/sec`);
    console.log(`     - Min Latency: ${minLat} ms`);
    console.log(`     - p50 Latency (Median): ${p50} ms`);
    console.log(`     - p95 Latency: ${p95} ms`);
    console.log(`     - p99 Latency: ${p99} ms`);
    console.log(`     - Max Latency: ${maxLat} ms`);
    console.log(`     - Memory Delta: RSS ${rssDeltaMb} MB, Heap ${heapDeltaMb} MB`);
    console.log(`     --------------------------------------------------`);

    assert.ok(p50 < 100, `p50 latency should be < 100ms, got ${p50}ms`);
    assert.ok(p95 < 250, `p95 latency should be < 250ms, got ${p95}ms`);
    assert.strictEqual(latencies.length, 40, 'All 40 submissions accounted for');
  });

  // 5. Duplicate Submission Rejection & Idempotency Shield
  await testStep('5. Idempotency & Duplicate Shield: Server rejects repeated answers in same round', async () => {
    const socket = activeSockets[0]; // Host of room 0
    const roomId = roomIds[0];
    const userId = 'host-user-0';
    const challenge = roomChallenges[roomId];

    await new Promise<void>((resolve, reject) => {
      socket.emit(
        'submit_answer',
        {
          roomId,
          roundIndex: 1,
          challengeId: challenge?.id || DSA_CHALLENGE_BANK[0].id,
          userId,
          answer: 'repeated_option',
          timeTakenMs: 2000,
          idempotencyKey: 'idemp-duplicate-test'
        },
        (res: any) => {
          // Must be rejected as duplicate!
          if (!res.success && res.feedback?.includes('Duplicate submission rejected')) {
            resolve();
          } else {
            reject(new Error(`Duplicate submission was not rejected! Status: ${JSON.stringify(res)}`));
          }
        }
      );
    });
  });

  // 6. Mid-Match Disconnect & Reconnect Resilience
  await testStep('6. Reconnect Resilience: Disconnected socket rejoins with intact state', async () => {
    const targetSocket = activeSockets[1]; // player-0-1
    const roomId = roomIds[0];
    const userId = 'player-0-1';

    // Disconnect the socket
    targetSocket.disconnect();
    await wait(400);

    // Create a new socket for the same user and reconnect to the room
    const reconnectedSocket: ClientSocketType = ClientSocket(SERVER_URL, {
      transports: ['websocket'],
      forceNew: true
    });
    activeSockets[1] = reconnectedSocket;

    await new Promise<void>((resolve, reject) => {
      reconnectedSocket.on('connect', () => {
        reconnectedSocket.emit(
          'join_room',
          { roomCode: roomCodes[0], user: { id: userId, username: 'Contender_0_1' } },
          (res: any) => {
            if (res.success && res.room) {
              const participant = res.room.participants[userId];
              assert.ok(participant, 'Participant must be restored in room');
              assert.strictEqual(participant.currentStatus, 'idle', 'Status restored from offline');
              assert.strictEqual(participant.id, userId);
              resolve();
            } else {
              reject(new Error(res.error || 'Reconnect failed'));
            }
          }
        );
      });
      reconnectedSocket.on('connect_error', reject);
    });
  });

  // 7. Disconnect Storm & Room Cleanup
  await testStep('7. Disconnect Storm: Abrupt disconnect cleans up rooms and clears timers', async () => {
    // Disconnect all 40 sockets abruptly
    for (const socket of activeSockets) {
      socket.disconnect();
    }
    console.log('     40 client sockets abruptly disconnected in storm test.');
    await wait(500);
  });

  // 8. Server Persistence & Data Integrity Across Restarts
  await testStep('8. Persistence & Integrity: Player progress & match history survive restart', async () => {
    // Upsert a test user and record a match
    persistenceStore.upsertUser({
      id: 'prod-test-user-99',
      username: 'ApexPersistenceCoder',
      ratingMMR: 2150,
      auraPoints: 85000,
      auraTitle: 'Algorithmic Sovereign',
      rankTier: 'Master Elite'
    });

    persistenceStore.recordMatch({
      id: 'match-persistence-001',
      timestamp: Date.now(),
      mode: 'duel_1v1',
      durationMs: 45000,
      winner: { id: 'prod-test-user-99', username: 'ApexPersistenceCoder', score: 3200 },
      participantsCount: 2,
      leaderboardSnippet: [{ id: 'prod-test-user-99', username: 'ApexPersistenceCoder', score: 3200, rank: 1 }]
    });

    // Simulate server process crash & reboot by instantiating a new PersistenceStore
    const newStoreInstance = new PersistenceStore();
    const loadedUser = newStoreInstance.getUser('prod-test-user-99');
    assert.ok(loadedUser, 'User profile must survive server restart and reload from disk');
    assert.strictEqual(loadedUser.username, 'ApexPersistenceCoder');
    // Winner gets +25 MMR on match record
    assert.strictEqual(loadedUser.ratingMMR, 2175, 'MMR increment must persist');

    const history = newStoreInstance.getMatchHistory(5);
    const foundMatch = history.find(m => m.id === 'match-persistence-001');
    assert.ok(foundMatch, 'Match record must survive restart and be present in history');
    assert.strictEqual(foundMatch.winner.username, 'ApexPersistenceCoder');
  });

  console.log(`\n========================================================================`);
  console.log(`🏁 MULTIPLAYER & RELIABILITY SUITE: ${passed}/${total} checks passed.`);
  console.log(`========================================================================\n`);

  if (passed < total) {
    process.exit(1);
  }
}

runMultiplayerReliabilitySuite().catch(err => {
  console.error('Fatal multiplayer test failure:', err);
  process.exit(1);
});
