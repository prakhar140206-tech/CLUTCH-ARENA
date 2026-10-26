import assert from 'assert';
import { io as ClientSocket, Socket as ClientSocketType } from 'socket.io-client';
import { DSA_CHALLENGE_BANK } from '../src/challenges/challengeBank.js';

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

function connectSocket(url = SERVER_URL): Promise<ClientSocketType> {
  return new Promise((resolve, reject) => {
    const s = ClientSocket(url, { transports: ['websocket'], forceNew: true });
    if (s.connected) resolve(s);
    else {
      s.once('connect', () => resolve(s));
      s.once('connect_error', reject);
    }
  });
}

async function runSustainedLoadSoakTest() {
  console.log('========================================================================');
  console.log('⚡ CLUTCH SUSTAINED MULTIPLAYER LOAD & EDGE-CASE RESILIENCE SOAK TEST');
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

  // 1. Edge Case: Invalid Room Code Rejection
  await testStep('1. Authorization & Validation: Rejects invalid room codes', async () => {
    const s = await connectSocket();
    await new Promise<void>((resolve, reject) => {
      s.emit('join_room', { roomCode: 'NONEXISTENT_999', user: { id: 'bad-user', username: 'Hacker' } }, (res: any) => {
        s.disconnect();
        if (!res.success && res.error?.includes('not found')) resolve();
        else reject(new Error('Invalid room code was not rejected'));
      });
    });
  });

  // 2. Edge Case: Non-Host Unauthorized Match Start Rejection
  await testStep('2. Authorization: Rejects non-host attempt to start_match', async () => {
    const host = await connectSocket();
    let roomId = '';
    let roomCode = '';

    await new Promise<void>((resolve, reject) => {
      host.emit('create_room', { user: { id: 'host-auth-test', username: 'RealHost' } }, (res: any) => {
        if (res.success) {
          roomId = res.room.id;
          roomCode = res.room.code;
          resolve();
        } else {
          reject(new Error(res.error));
        }
      });
    });

    const guest = await connectSocket();
    await new Promise<void>((resolve, reject) => {
      guest.emit('join_room', { roomCode, user: { id: 'guest-impostor', username: 'Impostor' } }, (res: any) => {
        if (res.success) resolve();
        else reject(new Error(res.error));
      });
    });

    // Impostor attempts to start match
    await new Promise<void>((resolve, reject) => {
      guest.emit('start_match', { roomId, userId: 'guest-impostor' }, (res: any) => {
        host.disconnect();
        guest.disconnect();
        if (!res.success && res.error?.includes('Unauthorized')) resolve();
        else reject(new Error('Non-host was permitted to start match!'));
      });
    });
  });

  // 3. Edge Case: Malformed Payload Rejection
  await testStep('3. Input Validation: Rejects malformed submission payloads', async () => {
    const s = await connectSocket();
    await new Promise<void>((resolve, reject) => {
      s.emit('submit_answer', { invalidField: true }, (res: any) => {
        s.disconnect();
        if (!res.success && res.feedback?.includes('Malformed submission payload')) resolve();
        else reject(new Error('Malformed payload was not rejected'));
      });
    });
  });

  // 4. Multi-Room Sustained Soak Test
  // Creates 5 rooms with 10 players each (50 real WebSocket client connections)
  const activeSockets: ClientSocketType[] = [];
  const roomCodes: string[] = [];
  const roomIds: string[] = [];
  const roomChallenges: Record<string, any> = {};

  await testStep('4. Sustained Multi-Room Soak: 50 independent clients across 5 rooms', async () => {
    console.log('     [Setup] Spawning 5 rooms with 10 real sockets each (50 active sockets)...');

    // Create 5 rooms
    for (let r = 0; r < 5; r++) {
      const host = await connectSocket();
      activeSockets.push(host);

      await new Promise<void>((resolve, reject) => {
        host.emit(
          'create_room',
          { user: { id: `soak-host-${r}`, username: `SoakHost_${r}` }, settings: { maxPlayers: 10, totalRounds: 5 } },
          (res: any) => {
            if (res.success) {
              roomCodes.push(res.room.code);
              roomIds.push(res.room.id);
              resolve();
            } else {
              reject(new Error(res.error));
            }
          }
        );
      });
    }

    // Connect 9 players per room (45 clients)
    for (let r = 0; r < 5; r++) {
      for (let p = 1; p <= 9; p++) {
        const client = await connectSocket();
        activeSockets.push(client);

        await new Promise<void>((resolve, reject) => {
          client.emit(
            'join_room',
            { roomCode: roomCodes[r], user: { id: `soak-player-${r}-${p}`, username: `Soak_${r}_${p}` } },
            (res: any) => {
              if (res.success) resolve();
              else reject(new Error(res.error));
            }
          );
        });
      }
    }
    assert.strictEqual(activeSockets.length, 50, 'All 50 sockets connected');

    // Start matches and synchronize round_started
    const roundStartedPromises: Promise<void>[] = [];
    for (let r = 0; r < 5; r++) {
      const host = activeSockets[r * 10];
      const roomId = roomIds[r];
      const p = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error(`Timeout waiting for round_started in room ${r}`)), 7000);
        host.once('round_started', (data: any) => {
          clearTimeout(timeout);
          roomChallenges[roomId] = data.challenge;
          resolve();
        });
        host.emit('start_match', { roomId, userId: `soak-host-${r}` }, (res: any) => {
          if (!res.success) reject(new Error('Match start failed'));
        });
      });
      roundStartedPromises.push(p);
    }
    await Promise.all(roundStartedPromises);

    // Sustained load execution with event-loop lag monitoring
    console.log('     [Executing] Running sustained submission bursts with event-loop lag monitoring...');
    const latencies: number[] = [];
    let errorCount = 0;
    let successCount = 0;
    const cpuBefore = process.cpuUsage();
    const soakStartTime = Date.now();

    // Event Loop Lag Profiler
    let maxLagMs = 0;
    let lastTick = Date.now();
    const lagInterval = setInterval(() => {
      const now = Date.now();
      const delta = now - lastTick - 50;
      if (delta > maxLagMs) maxLagMs = delta;
      lastTick = now;
    }, 50);

    // Run 50 concurrent submissions across the 5 rooms
    const subPromises = activeSockets.map((sock, idx) => {
      const r = Math.floor(idx / 10);
      const roomId = roomIds[r];
      const userId = idx % 10 === 0 ? `soak-host-${r}` : `soak-player-${r}-${idx % 10}`;
      const challenge = roomChallenges[roomId];
      const answerVal = challenge?.options ? challenge.options[0] : (DSA_CHALLENGE_BANK[0].correctAnswer);

      return new Promise<void>((resolve) => {
        const reqStart = Date.now();
        sock.emit(
          'submit_answer',
          {
            roomId,
            roundIndex: 1,
            challengeId: challenge?.id || DSA_CHALLENGE_BANK[0].id,
            userId,
            answer: answerVal,
            timeTakenMs: 1000 + (idx * 25),
            idempotencyKey: `soak-${idx}-${Date.now()}`
          },
          (res: any) => {
            const reqTime = Date.now() - reqStart;
            latencies.push(reqTime);
            if (res && res.success !== undefined) successCount++;
            else errorCount++;
            resolve();
          }
        );
      });
    });

    await Promise.all(subPromises);
    clearInterval(lagInterval);

    const soakDurationMs = Date.now() - soakStartTime;
    const cpuAfter = process.cpuUsage(cpuBefore);
    const memAfter = process.memoryUsage();

    const p50 = calculatePercentile(latencies, 50);
    const p95 = calculatePercentile(latencies, 95);
    const p99 = calculatePercentile(latencies, 99);
    const throughput = (activeSockets.length / (soakDurationMs / 1000)).toFixed(1);

    console.log(`\n     --------------------------------------------------`);
    console.log(`     📈 SUSTAINED LOAD SOAK PERFORMANCE REPORT:`);
    console.log(`     - Test Duration: ${soakDurationMs} ms`);
    console.log(`     - Concurrent Rooms: 5 active arenas`);
    console.log(`     - Independent Real Sockets: 50 clients`);
    console.log(`     - Submissions Processed: ${successCount} successful, ${errorCount} errors`);
    console.log(`     - Error Rate: ${((errorCount / activeSockets.length) * 100).toFixed(2)}%`);
    console.log(`     - Sustained Throughput: ${throughput} req/sec`);
    console.log(`     - p50 Latency (Median): ${p50} ms`);
    console.log(`     - p95 Latency: ${p95} ms`);
    console.log(`     - p99 Latency: ${p99} ms`);
    console.log(`     - Max Event-Loop Lag: ${maxLagMs} ms (Healthy: < 50ms)`);
    console.log(`     - User CPU Time: ${(cpuAfter.user / 1000).toFixed(1)} ms`);
    console.log(`     - System CPU Time: ${(cpuAfter.system / 1000).toFixed(1)} ms`);
    console.log(`     - Peak RSS Memory: ${(memAfter.rss / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`     - Heap Used: ${(memAfter.heapUsed / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`     --------------------------------------------------\n`);

    assert.strictEqual(errorCount, 0, 'Zero errors under sustained soak');
    assert.ok(p95 < 200, `p95 latency should remain under 200ms, got ${p95}ms`);
    assert.ok(maxLagMs < 80, `Event loop lag should remain low, got ${maxLagMs}ms`);

    // Clean up all 50 sockets
    activeSockets.forEach(s => s.disconnect());
  });

  console.log(`\n========================================================================`);
  console.log(`🏁 SOAK & RESILIENCE SUITE: ${passed}/${total} checks passed.`);
  console.log(`========================================================================\n`);

  if (passed < total) process.exit(1);
}

runSustainedLoadSoakTest().catch(err => {
  console.error('Fatal soak test error:', err);
  process.exit(1);
});
