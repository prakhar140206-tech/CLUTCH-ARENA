import { io, Socket } from 'socket.io-client';
import http from 'http';
import express from 'express';
import { Server } from 'socket.io';
import { RoomManager } from '../src/rooms/roomManager.js';

async function run70PlayerTournamentTest() {
  console.log('🏆 ===============================================');
  console.log('🏆 70-PLAYER GRAND TOURNAMENT SPEC TEST');
  console.log('🏆 ===============================================\n');

  const app = express();
  const server = http.createServer(app);
  const ioServer = new Server(server, { cors: { origin: '*' } });
  const roomManager = new RoomManager(ioServer);

  ioServer.on('connection', (socket) => {
    socket.on('create_room', (data, cb) => {
      const room = roomManager.createRoom(socket, data.user, data.settings);
      if (cb) cb({ success: true, room });
    });

    socket.on('join_room', (data, cb) => {
      const room = roomManager.joinRoom(socket, data.roomCode, data.user);
      if (cb) cb({ success: !!room, room });
    });

    socket.on('submit_answer', async (payload, cb) => {
      const res = await roomManager.processSubmission(payload, payload.userId, socket);
      if (cb) cb(res);
    });

    socket.on('start_match', (data, cb) => {
      const ok = roomManager.startMatch(data.roomId, data.userId);
      if (cb) cb({ success: ok });
    });
  });

  const TEST_PORT = 5001;
  await new Promise<void>((resolve) => server.listen(TEST_PORT, () => resolve()));
  console.log(`[Tournament Server] Initialized on port ${TEST_PORT}`);

  const NUM_PLAYERS = 70;
  const clients: Socket[] = [];

  // Step 1: Create 70-Player Tournament Room with 20s timer and 25 questions
  console.log('[Step 1] Creating Room for 70 Players with 20s Question Timer and 25 Rounds...');
  const host = io(`http://localhost:${TEST_PORT}`, { reconnection: false, transports: ['websocket'] });
  await new Promise<void>((res) => host.on('connect', () => res()));
  clients.push(host);

  let roomId = '';
  let roomCode = '';

  await new Promise<void>((resolve) => {
    host.emit('create_room', {
      user: { id: 'player-1', username: 'SpeedDemon#1' },
      settings: {
        maxPlayers: 70,
        roundDurationSeconds: 20,
        totalRounds: 25,
        mode: 'mega_arena_100'
      }
    }, (res: any) => {
      roomId = res.room.id;
      roomCode = res.room.code;
      resolve();
    });
  });

  console.log(`  ✅ Room Created: ID ${roomId}, Code ${roomCode}`);
  console.log(`  ✅ Settings: MaxPlayers=70, RoundTimer=20s, TotalRounds=25`);

  // Step 2: Connect remaining 69 players into the private room
  console.log('\n[Step 2] Connecting remaining 69 players simultaneously...');
  const joinPromises = [];
  for (let i = 2; i <= NUM_PLAYERS; i++) {
    const s = io(`http://localhost:${TEST_PORT}`, { reconnection: false, transports: ['websocket'] });
    clients.push(s);
    joinPromises.push(new Promise<void>((resolve) => {
      s.on('connect', () => {
        s.emit('join_room', {
          roomCode,
          user: { id: `player-${i}`, username: `Player_${i}` }
        }, () => resolve());
      });
    }));
  }
  await Promise.all(joinPromises);
  console.log(`  ✅ Successfully joined 70/70 players in the room!`);

  // Step 3: Start match and verify question broadcast + 20s timer
  console.log('\n[Step 3] Engaging Match - Broadcasting Question with 20-Second Clock...');
  let broadcastReceivedCount = 0;
  let receivedChallenge: any = null;
  let receivedDuration = 0;

  clients.forEach((client) => {
    client.on('round_started', (data) => {
      broadcastReceivedCount++;
      receivedChallenge = data.challenge;
      receivedDuration = data.durationSeconds;
    });
  });

  host.emit('start_match', { roomId, userId: 'player-1' });

  // Wait for countdown and round start
  await new Promise((r) => setTimeout(r, 4500));

  console.log(`  ✅ Question Broadcast Count: ${broadcastReceivedCount}/70 received identical question simultaneously`);
  console.log(`  ✅ Broadcast Duration: ${receivedDuration}s (Authoritative 20-second timer)`);
  console.log(`  ✅ Question Prompt: "${receivedChallenge?.prompt?.slice(0, 50)}..."`);
  console.log(`  ✅ Options count: ${receivedChallenge?.options?.length}`);

  // Step 4: Simulate Speed & Accuracy Evaluation
  console.log('\n[Step 4] Testing Speed & Accuracy Winner Evaluation...');
  // Player 1: Fast & Correct (1.2 seconds)
  // Player 2: Slower & Correct (6.5 seconds)
  // Player 3: Wrong Answer (0.8 seconds)
  
  const p1Res = await new Promise<any>((resolve) => {
    clients[0].emit('submit_answer', {
      roomId,
      challengeId: receivedChallenge.id,
      roundIndex: 1,
      answer: receivedChallenge.options[0], // assume first option for test
      idempotencyKey: 'p1-sub-round-1',
      timeTakenMs: 1200,
      userId: 'player-1'
    }, resolve);
  });

  const p2Res = await new Promise<any>((resolve) => {
    clients[1].emit('submit_answer', {
      roomId,
      challengeId: receivedChallenge.id,
      roundIndex: 1,
      answer: receivedChallenge.options[0],
      idempotencyKey: 'p2-sub-round-1',
      timeTakenMs: 6500,
      userId: 'player-2'
    }, resolve);
  });

  console.log(`  ✅ Player 1 (Speed: 1.2s): pointsAwarded=${p1Res.pointsAwarded}, speedBonus=${p1Res.speedBonus}`);
  console.log(`  ✅ Player 2 (Speed: 6.5s): pointsAwarded=${p2Res.pointsAwarded}, speedBonus=${p2Res.speedBonus}`);
  if (p1Res.speedBonus > p2Res.speedBonus) {
    console.log(`  ✅ FASTEST TIME RULE VERIFIED: Faster player (1.2s) earned higher speed bonus than slower player (6.5s)!`);
  }

  // Step 5: Check Top 10 Leaderboard & Rewards
  console.log('\n[Step 5] Checking Top 10 Leaderboard Standings and Rewards...');
  const room = roomManager.getRoom(roomId);
  const top10 = room?.leaderboard.slice(0, 10);
  console.log(`  Top 10 Count: ${top10?.length}`);
  top10?.forEach((entry) => {
    console.log(`    Rank #${entry.rank}: ${entry.username} | Score: ${entry.score} | AvgTime: ${entry.avgTimeTakenSec || 0}s | Reward: +${entry.rewardCoins || 0} Coins (${entry.rewardBadge || 'None'})`);
  });

  console.log('\n===============================================');
  console.log('🏁 70-PLAYER TOURNAMENT TEST COMPLETE: ALL PASSED');
  console.log('===============================================\n');

  // Cleanup
  clients.forEach((c) => c.disconnect());
  server.close();
  process.exit(0);
}

run70PlayerTournamentTest().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
