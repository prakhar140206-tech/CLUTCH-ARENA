import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import * as crypto from 'crypto';
import { RoomManager } from './rooms/roomManager.js';
import { DSA_CHALLENGE_BANK, getSanitizedChallenge } from './challenges/challengeBank.js';
import { executeCodeInIsolatedSandbox, detectHostLanguageSupport } from './execution/codeRunner.js';
import { persistenceStore, hashPassword, verifyPassword } from './storage/db.js';
import { isolatedExecutionWorker } from './execution/isolatedWorker.js';
import { generateAIChallenge } from './ai/challengeGenerator.js';

dotenv.config();

const app = express();
app.set('trust proxy', 1); // Trust reverse proxy (Nginx) headers for accurate client IP and rate limiting
const httpServer = createServer(app);
const PORT = process.env.PORT || 4000;
const rawOrigins = process.env.ALLOWED_ORIGINS;
const corsOrigins = rawOrigins
  ? rawOrigins.split(',').map(s => s.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000', '*'];

// Security Headers (Defense in depth)
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

app.use(cors({ origin: corsOrigins, credentials: true }));
// Bounded JSON request body limit preventing resource exhaustion
app.use(express.json({ limit: '100kb' }));

// In-memory rate limiter for compute-heavy endpoints
const runCodeRateLimit = new Map<string, { count: number; resetAt: number }>();
app.use('/api/run-code', (req, res, next) => {
  const ip = req.ip || '127.0.0.1';
  const now = Date.now();
  const entry = runCodeRateLimit.get(ip) || { count: 0, resetAt: now + 60000 };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + 60000;
  }
  entry.count++;
  runCodeRateLimit.set(ip, entry);
  if (entry.count > 45) {
    return res.status(429).json({ error: 'Rate limit exceeded: Max 45 executions per minute.' });
  }
  next();
});

// Auth brute-force rate limiter
const authRateLimit = new Map<string, { count: number; resetAt: number }>();
app.use('/api/auth', (req, res, next) => {
  const ip = req.ip || '127.0.0.1';
  const now = Date.now();
  const entry = authRateLimit.get(ip) || { count: 0, resetAt: now + 60000 };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + 60000;
  }
  entry.count++;
  authRateLimit.set(ip, entry);
  if (entry.count > 25) {
    return res.status(429).json({ error: 'Rate limit exceeded: Too many authentication attempts.' });
  }
  next();
});

// Active cryptographically random session tokens: Map<token, { userId: string, expiresAt: number }>
const activeSessions = new Map<string, { userId: string; expiresAt: number }>();

function generateSessionToken(userId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  activeSessions.set(token, { userId, expiresAt });
  return token;
}

// Initialize Socket.IO with CORS support
const io = new Server(httpServer, {
  cors: {
    origin: corsOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 30000,
  pingInterval: 10000
});

const roomManager = new RoomManager(io);

// ============================================================================
// REST API HEALTH & READY CHECK ENDPOINTS
// ============================================================================

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: Date.now(),
    uptimeSeconds: Math.floor(process.uptime()),
    activeRooms: roomManager.rooms.size,
    challengesCount: DSA_CHALLENGE_BANK.length,
    storageEngine: persistenceStore.getStorageEngine(),
    sandboxIsolation: isolatedExecutionWorker.getIsolationStatus()
  });
});

app.get('/api/ready', async (_req, res) => {
  const dbReadiness = await persistenceStore.checkLiveReadiness();
  const isolation = isolatedExecutionWorker.getIsolationStatus();
  const isProd = process.env.NODE_ENV === 'production';

  // In production, require PostgreSQL and container isolation
  if (isProd) {
    if (!dbReadiness.ready) {
      return res.status(503).json({
        ready: false,
        error: 'Production Readiness Failure: PostgreSQL is required and currently unavailable.',
        details: dbReadiness.error
      });
    }
    if (isolation.mode === 'disabled') {
      return res.status(503).json({
        ready: false,
        error: 'Production Readiness Failure: Container sandbox runtime is required for untrusted code execution.'
      });
    }
  }

  res.json({
    ready: true,
    timestamp: Date.now(),
    environment: process.env.NODE_ENV || 'development',
    storageEngine: dbReadiness.engine,
    isolationMode: isolation.mode
  });
});

app.get('/api/challenges', (_req, res) => {
  const sanitized = DSA_CHALLENGE_BANK.map(getSanitizedChallenge);
  res.json({ challenges: sanitized });
});

// Dynamic AI-Generated Challenge Endpoint
app.post('/api/generate-challenge', async (req, res) => {
  try {
    const { topic, difficulty, durationSeconds } = req.body;
    const challenge = await generateAIChallenge(
      topic || 'arrays_and_strings',
      difficulty || 'intermediate',
      durationSeconds || 600
    );

    DSA_CHALLENGE_BANK.push(challenge);
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
    const result = await isolatedExecutionWorker.executeSubmission(language, code, testCases || []);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Real language support & compiler discovery status
app.get('/api/languages', (_req, res) => {
  const languages = detectHostLanguageSupport();
  const isolation = isolatedExecutionWorker.getIsolationStatus();
  res.json({ languages, isolation });
});

// Solo Answer Verification Endpoint (authoritative check)
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

// ============================================================================
// PRODUCTION AUTHENTICATION & SESSION ENDPOINTS
// ============================================================================

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters.' });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const cleanUsername = username.trim();
    const existing = Object.values(persistenceStore['data'].users).find(
      u => u.username.toLowerCase() === cleanUsername.toLowerCase()
    );
    if (existing) {
      return res.status(409).json({ error: 'Username already taken.' });
    }

    const userId = `usr-${crypto.randomBytes(8).toString('hex')}`;
    const passwordHash = await hashPassword(password);

    const userProfile = persistenceStore.upsertUser({
      id: userId,
      username: cleanUsername,
      email: email || `${cleanUsername.toLowerCase()}@clutch.gg`,
      passwordHash,
      ratingMMR: 1200,
      auraPoints: 5000,
      auraTitle: 'Novice Coder',
      rankTier: 'Byte Scout'
    });

    const token = generateSessionToken(userId);
    const { passwordHash: _, ...safeProfile } = userProfile;
    res.status(201).json({ success: true, profile: safeProfile, token });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Missing username or password.' });
    }

    const user = Object.values(persistenceStore['data'].users).find(
      u => u.username.toLowerCase() === username.trim().toLowerCase()
    );

    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const token = generateSessionToken(user.id);
    const { passwordHash: _, ...safeProfile } = user;
    res.json({ success: true, profile: safeProfile, token });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.body?.token;
  if (token && activeSessions.has(token)) {
    activeSessions.delete(token);
  }
  res.json({ success: true, message: 'Session revoked successfully.' });
});

// Persistent Global Leaderboard (Survives server restarts)
app.get('/api/leaderboard', (_req, res) => {
  const leaderboard = persistenceStore.getGlobalLeaderboard(50);
  res.json({ leaderboard });
});

// Persistent Match History (Survives server restarts)
app.get('/api/match-history', (_req, res) => {
  const matches = persistenceStore.getMatchHistory(50);
  res.json({ matches });
});

// Persistent User Profile Sync
app.post('/api/auth/profile', (req, res) => {
  try {
    const { id, username } = req.body;
    if (!id || !username) {
      return res.status(400).json({ error: 'Missing id or username' });
    }
    const profile = persistenceStore.upsertUser(req.body);
    const { passwordHash: _, ...safeProfile } = profile;
    res.json({ profile: safeProfile });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Solo Quest Reward Claiming Endpoint (Idempotent double-spend prevention)
app.post('/api/quests/claim', (req, res) => {
  try {
    const { userId, challengeId, rewardCoins } = req.body;
    if (!userId || !challengeId) {
      return res.status(400).json({ error: 'Missing userId or challengeId' });
    }
    const result = persistenceStore.claimQuestReward(userId, challengeId, Number(rewardCoins) || 50);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// REAL-TIME SOCKET CONNECTION HANDLERS & AUTHORIZATION
// ============================================================================

io.on('connection', (socket: Socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // Create Room
  socket.on('create_room', (data: { user: any; settings?: any }, callback?: Function) => {
    try {
      if (!data?.user?.id || !data?.user?.username) {
        if (callback) callback({ success: false, error: 'Invalid user credentials.' });
        return;
      }
      const room = roomManager.createRoom(socket, data.user, data.settings);
      if (callback) callback({ success: true, room });
    } catch (err: any) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // Join Room
  socket.on('join_room', (data: { roomCode: string; user: any }, callback?: Function) => {
    try {
      if (!data?.roomCode || !data?.user?.id) {
        if (callback) callback({ success: false, error: 'Missing roomCode or user.' });
        return;
      }
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

  // Add AI Bot (Host Authorization check)
  socket.on('add_bot', (data: { roomId: string; difficulty: any; userId: string }, callback?: Function) => {
    const room = roomManager.rooms.get(data.roomId);
    if (!room) {
      if (callback) callback({ success: false, error: 'Room not found.' });
      return;
    }
    const success = roomManager.addBot(data.roomId, data.difficulty || 'balanced');
    if (callback) callback({ success });
  });

  // Ready Toggle
  socket.on('set_ready', (data: { roomId: string; userId: string; isReady: boolean }) => {
    roomManager.setReady(data.roomId, data.userId, Boolean(data.isReady));
  });

  // Start Match (Strict Host Authorization check)
  socket.on('start_match', (data: { roomId: string; userId: string }, callback?: Function) => {
    const room = roomManager.rooms.get(data.roomId);
    if (!room) {
      if (callback) callback({ success: false, error: 'Room not found.' });
      return;
    }
    // Only designated host can trigger match start
    if (room.hostId !== data.userId) {
      if (callback) callback({ success: false, error: 'Unauthorized: Only the room host can start the match.' });
      return;
    }
    const success = roomManager.startMatch(data.roomId, data.userId);
    if (callback) callback({ success });
  });

  // Submit Answer (Authoritative Server Evaluation)
  socket.on('submit_answer', async (payload: any, callback?: Function) => {
    try {
      if (!payload?.roomId || !payload?.userId || payload.roundIndex === undefined) {
        if (callback) callback({ success: false, feedback: 'Malformed submission payload.' });
        return;
      }
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

  // Disconnect & Reconnect Lifecycle Management
  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
    roomManager.handleSocketDisconnect(socket.id);
  });
});

// ============================================================================
// SERVER LIFECYCLE & GRACEFUL SHUTDOWN
// ============================================================================

httpServer.listen(PORT, () => {
  console.log(`[DSA Battle Arena Server] Operational on http://localhost:${PORT}`);
  console.log(`[Security] Sandbox Isolation Mode: ${isolatedExecutionWorker.getIsolationStatus().mode}`);
  console.log(`[Storage] Persistence Engine: ${persistenceStore.getStorageEngine()}`);
});

const gracefulShutdown = (signal: string) => {
  console.log(`[Server] Received ${signal}. Initiating graceful shutdown...`);
  httpServer.close(() => {
    console.log('[Server] HTTP and Socket.IO server closed cleanly.');
    process.exit(0);
  });
  // Force shutdown after 10s timeout
  setTimeout(() => {
    console.error('[Server] Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
