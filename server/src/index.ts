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
import { 
  validateProductionEnvironment, 
  validateBearerTokenHeader, 
  getSecurityAuditReport,
  sanitizeInputString 
} from './config/securityConfig.js';
import { ScoringEngine } from './game/scoringEngine.js';
import { MasteryEngine } from './adaptive/masteryEngine.js';
import { RemediationEngine } from './adaptive/remediationEngine.js';
import { DSATopic, DSAOnboardingPreferences } from './types/shared.js';

dotenv.config();

// Fail-closed validation of required production secrets and environment variables
validateProductionEnvironment('api');

const app = express();
app.set('trust proxy', 1); // Trust reverse proxy (Nginx) headers for accurate client IP and rate limiting
const httpServer = createServer(app);
const PORT = process.env.PORT || 4000;
const rawOrigins = process.env.ALLOWED_ORIGINS;
const corsOrigins = rawOrigins
  ? rawOrigins.split(',').map(s => s.trim())
  : (process.env.NODE_ENV === 'production' ? [] : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000']);

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

// Helper to prevent memory leakage in rate limit tables
function cleanupRateLimitMap(map: Map<string, { count: number; resetAt: number }>) {
  if (map.size > 2000) {
    const now = Date.now();
    for (const [key, entry] of map.entries()) {
      if (now > entry.resetAt) {
        map.delete(key);
      }
    }
  }
}

// In-memory rate limiter for compute-heavy endpoints
const runCodeRateLimit = new Map<string, { count: number; resetAt: number }>();
app.use('/api/run-code', (req, res, next) => {
  const ip = req.ip || '127.0.0.1';
  const now = Date.now();
  cleanupRateLimitMap(runCodeRateLimit);
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
  cleanupRateLimitMap(authRateLimit);
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

// Periodic session cleanup every 30 minutes to eliminate stale memory
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of activeSessions.entries()) {
    if (now > session.expiresAt) {
      activeSessions.delete(token);
    }
  }
}, 30 * 60 * 1000).unref();

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
    sandboxIsolation: isolatedExecutionWorker.getIsolationStatus(),
    securityAudit: getSecurityAuditReport()
  });
});

app.get('/api/security-audit', (_req, res) => {
  res.json(getSecurityAuditReport());
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

// 13 Core DSA Disciplines tracked by the adaptive learning engine
const ALL_DSA_TOPICS: DSATopic[] = [
  'arrays_and_strings',
  'searching_and_sorting',
  'linked_lists',
  'stacks_and_queues',
  'recursion_and_backtracking',
  'trees_and_bst',
  'graphs',
  'greedy_algorithms',
  'dynamic_programming',
  'hashing',
  'heaps_and_priority_queues',
  'bit_manipulation',
  'complexity_analysis'
];

function getAuthenticatedUserId(req: express.Request): string | null {
  const authHeader = req.headers.authorization;
  let token: string | undefined;
  if (authHeader) {
    const bearer = validateBearerTokenHeader(authHeader);
    if (bearer.valid && bearer.token) {
      token = bearer.token;
    }
  } else if (typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (!token) return null;
  const session = activeSessions.get(token);
  if (!session || Date.now() > session.expiresAt) {
    if (session) activeSessions.delete(token);
    return null;
  }
  return session.userId;
}

// Diagnostic Quiz Questions for Level Calibration
app.get('/api/diagnostic-questions', (_req, res) => {
  const diagnostics = DSA_CHALLENGE_BANK
    .filter(c => c.provenance === 'diagnostic')
    .map(getSanitizedChallenge);
  res.json({ questions: diagnostics });
});

// Diagnostic Assessment Evaluation
app.post('/api/user/diagnostic-assess', (req, res) => {
  try {
    const { answers, userId } = req.body;
    const resolvedUserId = getAuthenticatedUserId(req) || userId || 'guest';
    if (!Array.isArray(answers)) {
      return res.status(400).json({ error: 'Answers must be an array of { questionId, answer }' });
    }

    let correctCount = 0;
    const diagnostics = DSA_CHALLENGE_BANK.filter(c => c.provenance === 'diagnostic');
    const total = diagnostics.length || 1;

    for (const item of answers) {
      const challenge = diagnostics.find(c => c.id === item.questionId);
      if (challenge) {
        const { isCorrect } = ScoringEngine.validateAnswer(challenge, item.answer);
        if (isCorrect) correctCount++;
      }
    }

    const assessedLevel = MasteryEngine.calculateDiagnosticLevel(correctCount, total);

    // If user is authenticated/identified, initialize or update preferences
    if (resolvedUserId && resolvedUserId !== 'guest') {
      const existing: DSAOnboardingPreferences = persistenceStore.getDSAPreferences(resolvedUserId) || {
        userId: resolvedUserId,
        languages: ['python'],
        experienceLevel: 'assess_my_level',
        preferredTopics: ['arrays_and_strings', 'searching_and_sorting'],
        preferredFormats: ['mcq', 'code_sprint'],
        goals: ['interview_prep'],
        progressionPacing: 'steady',
        completedAt: Date.now()
      };
      existing.diagnosticScore = correctCount;
      existing.assessedLevel = assessedLevel;
      existing.completedAt = Date.now();
      persistenceStore.saveDSAPreferences(existing);
    }

    res.json({
      success: true,
      correctCount,
      totalQuestions: total,
      assessedLevel,
      recommendedDifficulty: assessedLevel
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// User DSA Onboarding & Preferences Endpoint (GET)
app.get('/api/user/dsa-preferences', (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req) || (req.query.userId as string);
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const prefs = persistenceStore.getDSAPreferences(userId);
    res.json({ preferences: prefs || null });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// User DSA Onboarding & Preferences Endpoint (POST)
app.post('/api/user/dsa-preferences', (req, res) => {
  try {
    const authId = getAuthenticatedUserId(req);
    const userId = authId || req.body.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { languages, experienceLevel, preferredTopics, preferredFormats, goals, progressionPacing } = req.body;
    const saved = persistenceStore.saveDSAPreferences({
      userId,
      languages: languages || ['python'],
      experienceLevel: experienceLevel || 'beginner',
      preferredTopics: preferredTopics || ['arrays_and_strings'],
      preferredFormats: preferredFormats || ['mcq'],
      goals: goals || ['interview_prep'],
      progressionPacing: progressionPacing || 'steady',
      completedAt: Date.now()
    });

    res.json({ success: true, preferences: saved });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Concept Mastery Progress Dashboard Endpoint (GET)
app.get('/api/user/dsa-mastery', (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req) || (req.query.userId as string);
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const currentMastery = persistenceStore.getConceptMastery(userId);
    // Ensure all 13 topics have entries for clear progress reporting
    const fullMastery: Record<string, any> = {};
    for (const topic of ALL_DSA_TOPICS) {
      if (currentMastery[topic]) {
        fullMastery[topic] = currentMastery[topic];
      } else {
        fullMastery[topic] = MasteryEngine.createDefaultRecord(topic);
      }
    }

    res.json({ mastery: fullMastery });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Solo & Endless Answer Verification Endpoint (Format-Specific & Adaptive)
app.post('/api/verify-answer', (req, res) => {
  try {
    const { challengeId, answer, timeTakenMs, userId } = req.body;
    const challenge = DSA_CHALLENGE_BANK.find(c => c.id === challengeId);
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    const elapsedMs = Number(timeTakenMs) || (challenge.timeLimitSeconds * 500);
    const { isCorrect, partialCreditRatio, feedback } = ScoringEngine.validateAnswer(challenge, answer);

    const scoreResult = ScoringEngine.calculateScore({
      challenge,
      isCorrect,
      timeTakenMs: elapsedMs,
      currentCombo: 0,
      partialCreditRatio
    });

    // Update concept mastery if user is logged in
    const activeUserId = getAuthenticatedUserId(req) || userId;
    let updatedMastery = null;
    let remediation = null;

    if (activeUserId && activeUserId !== 'guest') {
      const topicMasteryMap = persistenceStore.getConceptMastery(activeUserId);
      const currentTopicRecord = topicMasteryMap[challenge.topic] || MasteryEngine.createDefaultRecord(challenge.topic);
      
      const newTopicRecord = MasteryEngine.evaluatePerformance(currentTopicRecord, {
        topic: challenge.topic,
        isCorrect,
        timeTakenMs: elapsedMs,
        timeLimitMs: (challenge.timeLimitSeconds || 20) * 1000
      });

      if (newTopicRecord.needsRemediation) {
        remediation = RemediationEngine.getRemediationPackage(challenge.topic, challenge.id);
        newTopicRecord.remediationStep = {
          conceptKey: remediation.conceptKey,
          explanation: remediation.explanation,
          workedExample: remediation.workedExample,
          practiceChallengeId: remediation.practiceChallengeId,
          reassessed: false
        };
      }

      updatedMastery = persistenceStore.updateConceptMastery(activeUserId, newTopicRecord);
    }

    res.json({
      isCorrect,
      partialCreditRatio,
      feedback,
      pointsAwarded: scoreResult.pointsAwarded,
      speedBonus: scoreResult.speedBonus,
      correctAnswer: isCorrect ? undefined : challenge.correctAnswer,
      explanation: challenge.explanation,
      masteryUpdate: updatedMastery,
      remediation
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

    const authenticatedUserId = getAuthenticatedUserId(req);
    // Allow initial guest registration or enforce ID match for existing profiles
    const existing = persistenceStore.getUser(id);
    if (existing && authenticatedUserId && authenticatedUserId !== id) {
      return res.status(403).json({ error: 'Forbidden: You can only update your own profile.' });
    }

    // Strip protected fields to prevent privilege escalation or password tampering
    const { passwordHash: _ph, id: _id, ...safePayload } = req.body;
    const sanitizedUsername = sanitizeInputString(username, 50);

    const profile = persistenceStore.upsertUser({
      ...safePayload,
      id,
      username: sanitizedUsername
    });
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
