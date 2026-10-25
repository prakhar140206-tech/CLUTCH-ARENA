import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { RoomManager } from './rooms/roomManager.js';
import { DSA_CHALLENGE_BANK, getSanitizedChallenge } from './challenges/challengeBank.js';
import { executeCodeInIsolatedSandbox } from './execution/codeRunner.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: '*' }));
app.use(express.json());

// Initialize Socket.IO with CORS support
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  pingTimeout: 30000,
  pingInterval: 10000
});

const roomManager = new RoomManager(io);

// REST API Health & Challenge Bank endpoints
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: Date.now(),
    activeRooms: roomManager.rooms.size,
    challengesCount: DSA_CHALLENGE_BANK.length
  });
});

app.get('/api/challenges', (req, res) => {
  const sanitized = DSA_CHALLENGE_BANK.map(getSanitizedChallenge);
  res.json({ challenges: sanitized });
});

// Dynamic AI-Generated Challenge Endpoint
app.post('/api/generate-ai-challenge', async (req, res) => {
  try {
    const { topic, difficulty, timeLimitSeconds } = req.body;
    const { generateAIChallenge } = await import('./ai/challengeGenerator.js');
    const challenge = await generateAIChallenge(
      topic || 'arrays_and_strings',
      difficulty || 'beginner',
      timeLimitSeconds || 30
    );

    // Cache challenge in DSA_CHALLENGE_BANK so scoring & validation engine recognizes it
    DSA_CHALLENGE_BANK.push(challenge);

    // Return client-safe view
    const clientSafe = getSanitizedChallenge(challenge);
    res.json({ challenge: clientSafe });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Standalone code execution endpoint (for solo practice / test runner)
app.post('/api/run-code', async (req, res) => {
  try {
    const { language, code, testCases } = req.body;
    if (!code || !language) {
      return res.status(400).json({ error: 'Missing code or language' });
    }
    const result = await executeCodeInIsolatedSandbox(language, code, testCases || []);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Solo Answer Verification Endpoint (authoritative check for AI generated questions)
app.post('/api/verify-answer', (req, res) => {
  try {
    const { challengeId, answer } = req.body;
    const challenge = DSA_CHALLENGE_BANK.find(c => c.id === challengeId);
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    const isCorrect = String(answer).trim().toLowerCase() === String(challenge.correctAnswer).trim().toLowerCase();
    res.json({
      isCorrect,
      correctAnswer: isCorrect ? undefined : challenge.correctAnswer,
      explanation: challenge.explanation
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Real-Time Socket Connection Handlers
io.on('connection', (socket: Socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // Create Room
  socket.on('create_room', (data: { user: any; settings?: any }, callback?: Function) => {
    try {
      const room = roomManager.createRoom(socket, data.user, data.settings);
      if (callback) callback({ success: true, room });
    } catch (err: any) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // Join Room
  socket.on('join_room', (data: { roomCode: string; user: any }, callback?: Function) => {
    try {
      const room = roomManager.joinRoom(socket, data.roomCode, data.user);
      if (room) {
        if (callback) callback({ success: true, room });
      } else {
        if (callback) callback({ success: false, error: 'Room not found or full.' });
      }
    } catch (err: any) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // Add AI Bot
  socket.on('add_bot', (data: { roomId: string; difficulty: any }, callback?: Function) => {
    const success = roomManager.addBot(data.roomId, data.difficulty || 'balanced');
    if (callback) callback({ success });
  });

  // Ready Toggle
  socket.on('set_ready', (data: { roomId: string; userId: string; isReady: boolean }) => {
    roomManager.setReady(data.roomId, data.userId, data.isReady);
  });

  // Start Match
  socket.on('start_match', (data: { roomId: string; userId: string }, callback?: Function) => {
    const success = roomManager.startMatch(data.roomId, data.userId);
    if (callback) callback({ success });
  });

  // Submit Answer
  socket.on('submit_answer', async (payload: any, callback?: Function) => {
    try {
      const result = await roomManager.processSubmission(payload, payload.userId, socket);
      if (callback) callback(result);
    } catch (err: any) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // Avatar Loadout Update
  socket.on('update_loadout', (data: { roomId: string; userId: string; loadout: any }) => {
    const room = roomManager.rooms.get(data.roomId);
    if (room && room.participants[data.userId]) {
      room.participants[data.userId].loadout = data.loadout;
      roomManager.syncRoomState(data.roomId);
    }
  });

  // Leave Room
  socket.on('leave_room', (data: { roomId: string; userId: string }) => {
    roomManager.leaveRoom(socket, data.roomId, data.userId);
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`[DSA Battle Arena Server] Operational on http://localhost:${PORT}`);
});
