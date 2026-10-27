import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import {
  RoomState,
  RoomSettings,
  Participant,
  SubmissionPayload,
  SubmissionResponse,
  Challenge,
  Difficulty,
  ProgressiveStageLevel
} from '../types/shared.js';
import { DSA_CHALLENGE_BANK, getSanitizedChallenge } from '../challenges/challengeBank.js';
import { ScoringEngine } from '../game/scoringEngine.js';
import { BotEngine, BOT_PROFILES } from '../bots/botEngine.js';
import { executeCodeInIsolatedSandbox } from '../execution/codeRunner.js';
import { isolatedExecutionWorker } from '../execution/isolatedWorker.js';
import { generateAIChallenge } from '../ai/challengeGenerator.js';
import { persistenceStore } from '../storage/db.js';
import { sheetsSyncWorker } from '../sheets/sheetsSyncWorker.js';

export class RoomManager {
  private io: Server;
  public rooms: Map<string, RoomState> = new Map();
  // Room code to room ID mapping
  private codeToRoomId: Map<string, string> = new Map();
  // Round timers
  private roundTimers: Map<string, NodeJS.Timeout> = new Map();
  // Overall match duration authoritative timers (10, 15, 20, 25, 30, 45, 60 min)
  private matchTimers: Map<string, NodeJS.Timeout> = new Map();
  // Bot active timers
  private botTimers: Map<string, NodeJS.Timeout[]> = new Map();
  // Tracking delivered challenge IDs per room to prevent duplicate questions within a match
  private deliveredChallenges: Map<string, Set<string>> = new Map();
  // Processed submission idempotency keys to prevent duplicates
  private processedSubmissions: Set<string> = new Set();
  // Submissions per room per round: Map<roomId_roundIndex_participantId, boolean>
  private roundSubmissions: Map<string, boolean> = new Map();
  // Active socket ID to user/room tracking for resilient disconnects & reconnects
  private socketToUser: Map<string, { userId: string; roomId: string }> = new Map();
  // Disconnect grace timers per user
  private disconnectGraceTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(io: Server) {
    this.io = io;
  }

  /**
   * Automatic 4-Stage Progressive Difficulty Engine across ALL game modes:
   * Level 1: Easy (0% - 25% match elapsed) - Basic arrays, strings, simple logic, introductory MCQs
   * Level 2: Medium (25% - 50% match elapsed) - Searching, sorting, linked lists, stacks, queues
   * Level 3: Hard / Very Hard (50% - 75% match elapsed) - Trees, graphs, recursion, advanced problem-solving
   * Level 4: Advanced / Extreme (75% - 100% match elapsed) - Dynamic programming, complex graphs, optimization
   */
  public static calculateProgressiveStage(elapsedMs: number, totalDurationMs: number): {
    stage: ProgressiveStageLevel;
    difficulty: Difficulty;
    stageName: string;
    stageSubtitle: string;
  } {
    const ratio = totalDurationMs > 0 ? elapsedMs / totalDurationMs : 0;
    if (ratio < 0.25) {
      return { stage: 1, difficulty: 'easy', stageName: 'Level 1: Easy', stageSubtitle: 'Basic arrays, strings, and introductory logic' };
    } else if (ratio < 0.50) {
      return { stage: 2, difficulty: 'medium', stageName: 'Level 2: Medium', stageSubtitle: 'Searching, sorting, linked lists, and stacks' };
    } else if (ratio < 0.75) {
      return { stage: 3, difficulty: 'hard', stageName: 'Level 3: Hard / Very Hard', stageSubtitle: 'Trees, graphs, and recursive algorithms' };
    } else {
      return { stage: 4, difficulty: 'advanced', stageName: 'Level 4: Advanced / Extreme', stageSubtitle: 'Dynamic programming and advanced optimizations' };
    }
  }

  public generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  public createRoom(hostSocket: Socket, hostUser: { id: string; username: string; loadout?: any }, customSettings?: Partial<RoomSettings>): RoomState {
    const roomId = uuidv4();
    let code = this.generateRoomCode();
    while (this.codeToRoomId.has(code)) {
      code = this.generateRoomCode();
    }

    const determinedMaxPlayers = customSettings?.maxPlayers
      ? Number(customSettings.maxPlayers)
      : (customSettings?.mode === 'duel_1v1' || customSettings?.mode === 'ai_arena' ? 2 : (customSettings?.mode === 'mega_arena_100' ? 70 : 16));

    const defaultSettings: RoomSettings = {
      maxPlayers: determinedMaxPlayers,
      totalRounds: customSettings?.totalRounds || 9999, // Endless: continues until overall timer expires
      roundDurationSeconds: customSettings?.questionDurationSeconds || 20,
      matchDurationMinutes: customSettings?.matchDurationMinutes || 25,
      questionDurationSeconds: customSettings?.questionDurationSeconds || 20,
      topicFilter: customSettings?.topicFilter || 'all',
      difficulty: customSettings?.difficulty || 'mixed',
      mode: customSettings?.mode || 'duel_1v1',
      allowSpectators: true,
      botFillCount: customSettings?.botFillCount || 0,
      isPrivate: customSettings?.isPrivate ?? false,
      allowedLanguages: customSettings?.allowedLanguages || ['python', 'javascript', 'cpp', 'java', 'c'],
      progressiveDifficulty: customSettings?.progressiveDifficulty ?? true
    };

    const hostParticipant: Participant = {
      id: hostUser.id,
      username: hostUser.username,
      isBot: false,
      isHost: true,
      isReady: true,
      score: 0,
      combo: 0,
      maxCombo: 0,
      isEliminated: false,
      levelStats: {
        1: { attempted: 0, solved: 0, totalTimeMs: 0 },
        2: { attempted: 0, solved: 0, totalTimeMs: 0 },
        3: { attempted: 0, solved: 0, totalTimeMs: 0 },
        4: { attempted: 0, solved: 0, totalTimeMs: 0 }
      },
      loadout: hostUser.loadout || {
        color: '#8B5CF6',
        visorGlow: '#A78BFA',
        meshStyle: 'cyber_ninja',
        trailEffect: 'electric_cyan',
        emote: 'wave'
      },
      currentStatus: 'idle',
      position3D: { x: 0, y: 0, z: 0 }
    };

    const room: RoomState = {
      id: roomId,
      code,
      name: `${hostUser.username}'s Arena`,
      hostId: hostUser.id,
      settings: defaultSettings,
      status: 'lobby',
      currentRound: 0,
      currentStage: 1,
      stageName: 'Level 1: Easy',
      participants: { [hostUser.id]: hostParticipant },
      leaderboard: [{
        id: hostUser.id,
        username: hostUser.username,
        score: 0,
        rank: 1,
        combo: 0,
        isEliminated: false,
        levelStats: hostParticipant.levelStats
      }]
    };

    this.rooms.set(roomId, room);
    this.codeToRoomId.set(code, roomId);
    this.socketToUser.set(hostSocket.id, { userId: hostUser.id, roomId });
    persistenceStore.upsertUser({ id: hostUser.id, username: hostUser.username });

    hostSocket.join(roomId);
    this.syncRoomState(roomId);

    // Google Sheets asynchronous outbox sync for CustomRooms
    sheetsSyncWorker.enqueue(
      'CustomRooms',
      {
        roomId: room.id,
        code: room.code,
        hostId: hostUser.id,
        hostUsername: hostUser.username,
        mode: defaultSettings.mode,
        maxPlayers: defaultSettings.maxPlayers,
        totalRounds: defaultSettings.totalRounds,
        matchDurationMinutes: defaultSettings.matchDurationMinutes,
        isPrivate: defaultSettings.isPrivate,
        status: 'lobby',
        createdAt: new Date().toISOString()
      },
      `room_${room.id}`
    );

    return room;
  }

  public joinRoom(socket: Socket, roomCodeOrId: string, user: { id: string; username: string; loadout?: any }): RoomState | null {
    const roomId = this.codeToRoomId.get(roomCodeOrId.toUpperCase()) || roomCodeOrId;
    const room = this.rooms.get(roomId);
    if (!room) {
      socket.emit('error_message', { message: 'Arena room not found.' });
      return null;
    }

    const participantCount = Object.keys(room.participants).length;
    if (participantCount >= room.settings.maxPlayers && !room.participants[user.id]) {
      socket.emit('error_message', { message: `Arena room is full (max ${room.settings.maxPlayers} players).` });
      return null;
    }

    if (room.status !== 'lobby' && !room.participants[user.id]) {
      // Allow spectator or late join if allowed
      if (!room.settings.allowSpectators) {
        socket.emit('error_message', { message: 'Match already in progress.' });
        return null;
      }
    }

    this.socketToUser.set(socket.id, { userId: user.id, roomId });
    persistenceStore.upsertUser({ id: user.id, username: user.username });

    // Cancel pending disconnect grace timer if reconnecting
    const pendingTimer = this.disconnectGraceTimers.get(user.id);
    if (pendingTimer) {
      clearTimeout(pendingTimer);
      this.disconnectGraceTimers.delete(user.id);
    }

    const isReconnecting = !!room.participants[user.id];

    if (!room.participants[user.id]) {
      // Calculate 3D spawn position spread around arena perimeter
      const index = participantCount;
      const angle = (index / Math.max(1, room.settings.maxPlayers)) * Math.PI * 2;
      const radius = room.settings.maxPlayers > 20 ? 18 : 8;

      room.participants[user.id] = {
        id: user.id,
        username: user.username,
        isBot: false,
        isHost: false,
        isReady: false,
        score: 0,
        combo: 0,
        maxCombo: 0,
        isEliminated: false,
        levelStats: {
          1: { attempted: 0, solved: 0, totalTimeMs: 0 },
          2: { attempted: 0, solved: 0, totalTimeMs: 0 },
          3: { attempted: 0, solved: 0, totalTimeMs: 0 },
          4: { attempted: 0, solved: 0, totalTimeMs: 0 }
        },
        loadout: user.loadout || {
          color: '#06B6D4',
          visorGlow: '#22D3EE',
          meshStyle: 'neon_bot',
          trailEffect: 'electric_cyan',
          emote: 'wave'
        },
        currentStatus: 'idle',
        position3D: {
          x: Math.cos(angle) * radius,
          y: 0,
          z: Math.sin(angle) * radius
        }
      };
    } else {
      room.participants[user.id].currentStatus = 'idle';
      this.io.to(roomId).emit('player_reconnected', { playerId: user.id });
    }

    socket.join(roomId);
    this.updateLeaderboard(roomId);
    this.syncRoomState(roomId);
    this.io.to(roomId).emit('player_joined', { player: room.participants[user.id] });

    return room;
  }

  public addBot(roomId: string, difficulty: 'beginner' | 'balanced' | 'speedrunner' | 'strategist' | 'advanced' | 'adaptive'): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const count = Object.keys(room.participants).length;
    if (count >= room.settings.maxPlayers) return false;

    const profile = BOT_PROFILES[difficulty];
    const botId = `bot-${uuidv4().slice(0, 8)}`;
    const angle = (count / room.settings.maxPlayers) * Math.PI * 2;
    const radius = room.settings.maxPlayers > 20 ? 18 : 8;

    room.participants[botId] = {
      id: botId,
      username: `${profile.name}#${Math.floor(100 + Math.random() * 900)}`,
      isBot: true,
      botDifficulty: difficulty,
      isHost: false,
      isReady: true,
      score: 0,
      combo: 0,
      maxCombo: 0,
      isEliminated: false,
      loadout: {
        color: profile.avatarColor,
        visorGlow: profile.visorGlow,
        meshStyle: 'quantum_mech',
        trailEffect: 'acid_pulse',
        emote: 'dance'
      },
      currentStatus: 'idle',
      position3D: {
        x: Math.cos(angle) * radius,
        y: 0,
        z: Math.sin(angle) * radius
      }
    };

    this.updateLeaderboard(roomId);
    this.syncRoomState(roomId);
    return true;
  }

  public leaveRoom(socket: Socket | null, roomId: string, userId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    if (socket && socket.id) {
      this.socketToUser.delete(socket.id);
      socket.leave(roomId);
    }

    const pending = this.disconnectGraceTimers.get(userId);
    if (pending) {
      clearTimeout(pending);
      this.disconnectGraceTimers.delete(userId);
    }

    delete room.participants[userId];

    // If host left, assign new host or delete room if empty
    const remainingIds = Object.keys(room.participants);
    if (remainingIds.length === 0) {
      this.clearRoomTimers(roomId);
      this.codeToRoomId.delete(room.code);
      this.rooms.delete(roomId);
    } else {
      if (room.hostId === userId) {
        room.hostId = remainingIds[0];
        room.participants[remainingIds[0]].isHost = true;
      }
      this.updateLeaderboard(roomId);
      this.syncRoomState(roomId);
      this.io.to(roomId).emit('player_left', { playerId: userId });
    }
  }

  public handleSocketDisconnect(socketId: string): void {
    const mapping = this.socketToUser.get(socketId);
    if (!mapping) return;
    this.socketToUser.delete(socketId);

    const { userId, roomId } = mapping;
    const room = this.rooms.get(roomId);
    if (!room || !room.participants[userId]) return;

    // Mark participant offline and notify room
    room.participants[userId].currentStatus = 'offline';
    this.syncRoomState(roomId);
    this.io.to(roomId).emit('player_disconnected', { playerId: userId });

    // Schedule 15-second grace window for reconnects
    const graceTimer = setTimeout(() => {
      this.disconnectGraceTimers.delete(userId);
      const currentRoom = this.rooms.get(roomId);
      if (!currentRoom) return;

      if (currentRoom.participants[userId]?.currentStatus === 'offline') {
        if (currentRoom.status === 'lobby') {
          this.leaveRoom(null, roomId, userId);
        }
      }

      // Check if room is completely abandoned by humans
      const nonBots = Object.values(currentRoom.participants).filter(p => !p.isBot);
      const allOffline = nonBots.every(p => p.currentStatus === 'offline');
      if (nonBots.length === 0 || allOffline) {
        this.clearRoomTimers(roomId);
        this.codeToRoomId.delete(currentRoom.code);
        this.rooms.delete(roomId);
      }
    }, 15000);

    this.disconnectGraceTimers.set(userId, graceTimer);
  }

  public setReady(roomId: string, userId: string, isReady: boolean): void {
    const room = this.rooms.get(roomId);
    if (!room || !room.participants[userId]) return;

    room.participants[userId].isReady = isReady;
    this.syncRoomState(roomId);
  }

  public startMatch(roomId: string, userId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room || room.hostId !== userId) return false;

    // Check if at least 1 player
    if (Object.keys(room.participants).length === 0) return false;

    room.status = 'countdown';
    room.currentRound = 0;

    // Server-authoritative overall match duration (10, 15, 20, 25, 30, 45, 60 min)
    const matchMinutes = room.settings.matchDurationMinutes || 25;
    const matchDurationMs = matchMinutes * 60 * 1000;
    const matchExpiresAt = Date.now() + 3000 + matchDurationMs;
    room.matchExpiresAt = matchExpiresAt;
    room.currentStage = 1;
    room.stageName = 'Level 1: Easy';

    // Schedule authoritative overall match deadline
    this.clearRoomTimers(roomId);
    const overallTimer = setTimeout(() => {
      this.finishMatch(roomId);
    }, 3000 + matchDurationMs);
    this.matchTimers.set(roomId, overallTimer);

    this.syncRoomState(roomId);

    let countdown = 3;
    const interval = setInterval(() => {
      this.io.to(roomId).emit('match_countdown', {
        countdown,
        matchExpiresAt: room.matchExpiresAt,
        matchDurationMinutes: matchMinutes
      });
      countdown--;
      if (countdown < 0) {
        clearInterval(interval);
        this.nextRound(roomId);
      }
    }, 1000);

    return true;
  }

  public async nextRound(roomId: string): Promise<void> {
    const room = this.rooms.get(roomId);
    if (!room) return;

    // Clear per-question timers
    const rTimer = this.roundTimers.get(roomId);
    if (rTimer) {
      clearTimeout(rTimer);
      this.roundTimers.delete(roomId);
    }
    const bList = this.botTimers.get(roomId);
    if (bList) {
      bList.forEach(clearTimeout);
      this.botTimers.delete(roomId);
    }

    const now = Date.now();
    // 1. Check if overall match timer expired
    if (room.matchExpiresAt && now >= room.matchExpiresAt) {
      this.finishMatch(roomId);
      return;
    }

    // 2. End-of-match rule:
    // If less time remains in the match than the configured question timer, do not start a question that cannot fit.
    const questionLimitSecs = room.settings.questionDurationSeconds || 20;
    const remainingMatchMs = Math.max(0, (room.matchExpiresAt || (now + 600000)) - now);
    if (remainingMatchMs < questionLimitSecs * 1000) {
      this.finishMatch(roomId);
      return;
    }

    room.currentRound += 1;
    room.status = 'in_round';

    // Reset status for active participants
    Object.values(room.participants).forEach(p => {
      if (!p.isEliminated) {
        p.currentStatus = 'coding';
      }
    });

    // 3. Automatic 4-Stage Progressive Difficulty Schedule across ALL game modes
    const totalMatchMs = (room.settings.matchDurationMinutes || 25) * 60 * 1000;
    const elapsedMs = Math.max(0, totalMatchMs - remainingMatchMs);
    const stageInfo = RoomManager.calculateProgressiveStage(elapsedMs, totalMatchMs);
    const previousStage = room.currentStage || 1;
    room.currentStage = stageInfo.stage;
    room.stageName = stageInfo.stageName;

    // Broadcast Stage Transition banner if level advanced
    if (previousStage !== stageInfo.stage) {
      this.io.to(roomId).emit('stage_transition', {
        stage: stageInfo.stage,
        stageName: stageInfo.stageName,
        difficulty: stageInfo.difficulty,
        message: `${stageInfo.stageName.toUpperCase()} UNLOCKED — ${stageInfo.difficulty.toUpperCase()} CHALLENGES`,
        subtitle: stageInfo.stageSubtitle
      });
    }

    // Performance adjustment within current stage
    const participantsList = Object.values(room.participants);
    const highestCombo = Math.max(...participantsList.map(p => p.combo), 0);
    const solvedLastRound = participantsList.filter(p => p.currentStatus === 'solved').length;
    const isHighPerforming = room.currentRound > 1 && (highestCombo >= 2 || solvedLastRound >= participantsList.length / 2);

    let targetDifficulty: Difficulty = stageInfo.difficulty;
    if (stageInfo.stage === 1) {
      targetDifficulty = 'easy';
    } else if (stageInfo.stage === 2) {
      targetDifficulty = isHighPerforming ? 'medium' : 'easy';
    } else if (stageInfo.stage === 3) {
      targetDifficulty = isHighPerforming ? 'hard' : 'medium';
    } else {
      targetDifficulty = isHighPerforming ? 'extreme_hard' : 'advanced';
    }

    const duration = questionLimitSecs;

    // 4. Question Deduplication & Selection with Language and Topic constraints
    if (!this.deliveredChallenges.has(roomId)) {
      this.deliveredChallenges.set(roomId, new Set());
    }
    const delivered = this.deliveredChallenges.get(roomId)!;

    let pool = DSA_CHALLENGE_BANK.filter(c => {
      if (c.provenance === 'diagnostic') return false;
      if (delivered.has(c.id)) return false;
      if (room.settings.topicFilter && room.settings.topicFilter !== 'all') {
        if (c.topic !== room.settings.topicFilter) return false;
      }
      if (room.settings.allowedLanguages && room.settings.allowedLanguages.length > 0) {
        if (c.languageRequirement && c.languageRequirement.length > 0) {
          const hasMatch = c.languageRequirement.some(l => room.settings.allowedLanguages!.includes(l));
          if (!hasMatch) return false;
        }
      }
      return true;
    });

    if (pool.length === 0) {
      delivered.clear(); // Reset history if exhausted
      pool = DSA_CHALLENGE_BANK.filter(c => {
        if (c.provenance === 'diagnostic') return false;
        if (room.settings.topicFilter && room.settings.topicFilter !== 'all') {
          if (c.topic !== room.settings.topicFilter) return false;
        }
        if (room.settings.allowedLanguages && room.settings.allowedLanguages.length > 0) {
          if (c.languageRequirement && c.languageRequirement.length > 0) {
            const hasMatch = c.languageRequirement.some(l => room.settings.allowedLanguages!.includes(l));
            if (!hasMatch) return false;
          }
        }
        return true;
      });
    }

    let selectedChallenge = pool.find(c => c.difficulty === targetDifficulty);
    if (!selectedChallenge) {
      // Graceful fallback to stage difficulty or pool member
      selectedChallenge = pool.find(c => c.difficulty === stageInfo.difficulty) || pool[0];
    }

    if (!selectedChallenge) {
      try {
        const possibleTopics: any[] = ['arrays_and_strings', 'trees_and_bst', 'graphs', 'complexity_analysis', 'dynamic_programming'];
        const chosenTopic = (room.settings.topicFilter && room.settings.topicFilter !== 'all')
          ? room.settings.topicFilter
          : possibleTopics[(room.currentRound - 1) % possibleTopics.length];
        selectedChallenge = await generateAIChallenge(chosenTopic, targetDifficulty, duration);
        DSA_CHALLENGE_BANK.push(selectedChallenge);
      } catch {
        selectedChallenge = DSA_CHALLENGE_BANK[0];
      }
    }

    delivered.add(selectedChallenge.id);

    const expiresAt = now + duration * 1000;
    room.roundExpiresAt = expiresAt;
    room.questionExpiresAt = expiresAt;
    room.activeChallenge = getSanitizedChallenge(selectedChallenge);

    this.syncRoomState(roomId);
    this.io.to(roomId).emit('round_started', {
      roundIndex: room.currentRound,
      challenge: room.activeChallenge,
      difficulty: targetDifficulty,
      stage: room.currentStage,
      stageName: room.stageName,
      durationSeconds: duration,
      questionExpiresAt: expiresAt,
      matchExpiresAt: room.matchExpiresAt,
      expiresAt
    });

    // Schedule AI Bot actions
    this.scheduleBotActions(roomId, selectedChallenge);

    // Authoritative server-side per-question expiration timer
    const timer = setTimeout(() => {
      this.handleRoundTimeout(roomId);
    }, duration * 1000);

    this.roundTimers.set(roomId, timer);
  }

  private scheduleBotActions(roomId: string, challenge: Challenge): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const botTimersList: NodeJS.Timeout[] = [];
    const highestHumanScore = Math.max(
      ...Object.values(room.participants).filter(p => !p.isBot).map(p => p.score),
      0
    );

    Object.values(room.participants).forEach(p => {
      if (p.isBot && !p.isEliminated) {
        const { delayMs, chosenAnswer } = BotEngine.calculateBotMove(p, challenge, highestHumanScore);
        const timer = setTimeout(async () => {
          await this.processSubmission({
            roomId,
            challengeId: challenge.id,
            roundIndex: room.currentRound,
            answer: chosenAnswer,
            idempotencyKey: `bot-${p.id}-${room.currentRound}`,
            timeTakenMs: delayMs
          }, p.id);
        }, delayMs);
        botTimersList.push(timer);
      }
    });

    this.botTimers.set(roomId, botTimersList);
  }

  public async processSubmission(
    payload: SubmissionPayload,
    userId: string,
    socket?: Socket
  ): Promise<SubmissionResponse> {
    const { roomId, challengeId, roundIndex, answer, language, idempotencyKey, timeTakenMs } = payload;
    const room = this.rooms.get(roomId);

    if (!room || room.status !== 'in_round' || room.currentRound !== roundIndex) {
      return {
        success: false,
        isCorrect: false,
        pointsAwarded: 0,
        speedBonus: 0,
        comboMultiplier: 1.0,
        totalScore: 0,
        feedback: 'Submission rejected: Stale round or round already closed.'
      };
    }

    // Overall match timer deadline check
    if (room.matchExpiresAt && Date.now() > room.matchExpiresAt) {
      return {
        success: false,
        isCorrect: false,
        pointsAwarded: 0,
        speedBonus: 0,
        comboMultiplier: 1.0,
        totalScore: 0,
        feedback: 'Match deadline expired. Submissions are closed.'
      };
    }

    // Per-question deadline check (with 2s network latency grace window)
    if (room.roundExpiresAt && Date.now() > room.roundExpiresAt + 2000) {
      return {
        success: false,
        isCorrect: false,
        pointsAwarded: 0,
        speedBonus: 0,
        comboMultiplier: 1.0,
        totalScore: 0,
        feedback: 'Question deadline expired. Submission too late.'
      };
    }

    // Check idempotency & single submission per round
    const subKey = `${roomId}_${roundIndex}_${userId}`;
    if (this.roundSubmissions.has(subKey) || this.processedSubmissions.has(idempotencyKey)) {
      return {
        success: false,
        isCorrect: false,
        pointsAwarded: 0,
        speedBonus: 0,
        comboMultiplier: 1.0,
        totalScore: 0,
        feedback: 'Duplicate submission rejected: Answer already recorded for this round.'
      };
    }

    const participant = room.participants[userId];
    if (!participant || participant.isEliminated) {
      return {
        success: false,
        isCorrect: false,
        pointsAwarded: 0,
        speedBonus: 0,
        comboMultiplier: 1.0,
        totalScore: 0,
        feedback: 'Player is eliminated or not in arena.'
      };
    }

    // Find reference challenge
    const challenge = DSA_CHALLENGE_BANK.find(c => c.id === challengeId);
    if (!challenge) {
      return {
        success: false,
        isCorrect: false,
        pointsAwarded: 0,
        speedBonus: 0,
        comboMultiplier: 1.0,
        totalScore: 0,
        feedback: 'Challenge not found.'
      };
    }

    this.roundSubmissions.set(subKey, true);
    this.processedSubmissions.add(idempotencyKey);

    let isCorrect = false;
    let partialCreditRatio = 0.0;
    let testResults: any = undefined;

    // Universal format validation
    if (challenge.type === 'code_sprint') {
      const execLang = (language === 'c' ? 'cpp' : (language || 'python')) as 'python' | 'cpp' | 'java' | 'javascript';
      const runnerRes = await isolatedExecutionWorker.executeSubmission(execLang, String(answer), challenge.testCases || []);
      isCorrect = runnerRes.allPassed;
      testResults = runnerRes.testResults;
      partialCreditRatio = isCorrect ? 1.0 : 0.0;
    } else {
      const validation = ScoringEngine.validateAnswer(challenge, answer);
      isCorrect = validation.isCorrect;
      partialCreditRatio = validation.partialCreditRatio;
    }

    // Calculate score server-side
    const scoreRes = ScoringEngine.calculateScore({
      challenge,
      isCorrect,
      timeTakenMs,
      currentCombo: participant.combo,
      partialCreditRatio,
      testCaseResults: testResults
    });

    // Track total time taken and correct answer statistics for tournament evaluation
    participant.totalTimeTakenMs = (participant.totalTimeTakenMs || 0) + timeTakenMs;

    // Record progressive level-wise stats
    const currentStage = room.currentStage || 1;
    if (!participant.levelStats) {
      participant.levelStats = {
        1: { attempted: 0, solved: 0, totalTimeMs: 0 },
        2: { attempted: 0, solved: 0, totalTimeMs: 0 },
        3: { attempted: 0, solved: 0, totalTimeMs: 0 },
        4: { attempted: 0, solved: 0, totalTimeMs: 0 }
      };
    }
    if (!participant.levelStats[currentStage]) {
      participant.levelStats[currentStage] = { attempted: 0, solved: 0, totalTimeMs: 0 };
    }
    participant.levelStats[currentStage].attempted += 1;
    participant.levelStats[currentStage].totalTimeMs += timeTakenMs;

    if (isCorrect) {
      participant.score += scoreRes.pointsAwarded;
      participant.combo += 1;
      participant.maxCombo = Math.max(participant.maxCombo, participant.combo);
      participant.currentStatus = 'solved';
      participant.correctCount = (participant.correctCount || 0) + 1;
      participant.levelStats[currentStage].solved += 1;
    } else {
      participant.combo = 0;
      participant.currentStatus = 'failed';
    }

    const roundsCount = Math.max(1, room.currentRound);
    participant.avgTimeTakenSec = Number(((participant.totalTimeTakenMs || 0) / (roundsCount * 1000)).toFixed(2));

    // Include explanation in response
    scoreRes.explanation = challenge.explanation;
    scoreRes.testCaseResults = testResults;

    // Google Sheets asynchronous outbox sync for QuestionAttempts
    sheetsSyncWorker.enqueue(
      'QuestionAttempts',
      {
        submissionId: idempotencyKey,
        roomId,
        roundIndex,
        userId: participant.id,
        username: participant.username,
        challengeId: challenge.id,
        topic: challenge.topic,
        difficulty: challenge.difficulty,
        isCorrect,
        pointsAwarded: scoreRes.pointsAwarded,
        speedBonus: scoreRes.speedBonus,
        timeTakenMs,
        timestamp: new Date().toISOString()
      },
      `attempt_${idempotencyKey}`
    );

    this.updateLeaderboard(roomId);
    this.syncRoomState(roomId);

    // Notify submitting player
    if (socket) {
      socket.emit('submission_result', scoreRes);
    }

    // Broadcast live event to room
    this.io.to(roomId).emit('player_submitted', {
      playerId: participant.id,
      username: participant.username,
      isCorrect,
      pointsAwarded: scoreRes.pointsAwarded,
      newScore: participant.score,
      newCombo: participant.combo,
      status: participant.currentStatus
    });

    // Check if all active non-eliminated players submitted
    const activeParticipants = Object.values(room.participants).filter(p => !p.isEliminated);
    const submittedCount = activeParticipants.filter(p => p.currentStatus === 'solved' || p.currentStatus === 'failed').length;

    if (submittedCount >= activeParticipants.length) {
      // All submitted, trigger round review early
      const rTimer = this.roundTimers.get(roomId);
      if (rTimer) {
        clearTimeout(rTimer);
        this.roundTimers.delete(roomId);
      }
      setTimeout(() => this.handleRoundTimeout(roomId), 800);
    }

    return scoreRes;
  }

  private handleRoundTimeout(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const rTimer = this.roundTimers.get(roomId);
    if (rTimer) {
      clearTimeout(rTimer);
      this.roundTimers.delete(roomId);
    }

    // Check if overall match timer has expired
    if (room.matchExpiresAt && Date.now() >= room.matchExpiresAt) {
      this.finishMatch(roomId);
      return;
    }

    room.status = 'round_review';

    // In elimination mode ('last_brain_standing'), eliminate the lowest score or wrong answer
    if (room.settings.mode === 'last_brain_standing') {
      const active = Object.values(room.participants).filter(p => !p.isEliminated);
      if (active.length > 1) {
        const failedPlayers = active.filter(p => p.currentStatus !== 'solved');
        const candidateToEliminate = failedPlayers.length > 0
          ? failedPlayers[failedPlayers.length - 1]
          : active.sort((a, b) => a.score - b.score)[0];

        if (candidateToEliminate) {
          candidateToEliminate.isEliminated = true;
          candidateToEliminate.currentStatus = 'eliminated';
          this.io.to(roomId).emit('player_eliminated', {
            playerId: candidateToEliminate.id,
            username: candidateToEliminate.username
          });
        }
      }
    }

    this.updateLeaderboard(roomId);
    this.syncRoomState(roomId);
    this.io.to(roomId).emit('round_ended', {
      roundIndex: room.currentRound,
      leaderboard: room.leaderboard,
      matchExpiresAt: room.matchExpiresAt
    });

    // Wait 1.5 seconds review, then immediately deliver next question
    setTimeout(() => {
      this.nextRound(roomId);
    }, 1500);
  }

  public finishMatch(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room || room.status === 'match_ended') return;

    this.clearRoomTimers(roomId);
    room.status = 'match_ended';
    this.updateLeaderboard(roomId);
    this.syncRoomState(roomId);

    const winner = room.leaderboard[0];

    // Persist completed match record and rankings to disk
    const matchId = uuidv4();
    const durationSeconds = (room.settings.matchDurationMinutes || 10) * 60;
    try {
      persistenceStore.recordMatch({
        id: matchId,
        timestamp: Date.now(),
        mode: room.settings.mode,
        durationMs: durationSeconds * 1000,
        winner: winner ? { id: winner.id, username: winner.username, score: winner.score } : { id: '', username: 'Nobody', score: 0 },
        participantsCount: Object.keys(room.participants).length,
        leaderboardSnippet: room.leaderboard.slice(0, 5)
      });
    } catch (err: any) {
      console.warn('[Storage] Failed to record match to persistent store:', err.message);
    }

    // Google Sheets asynchronous outbox sync for MatchResults & CustomRooms
    sheetsSyncWorker.enqueue(
      'MatchResults',
      {
        matchId,
        mode: room.settings.mode,
        durationSeconds,
        winnerId: winner?.id || '',
        winnerUsername: winner?.username || 'Nobody',
        winnerScore: winner?.score || 0,
        participantsCount: Object.keys(room.participants).length,
        timestamp: new Date().toISOString()
      },
      `match_${matchId}`
    );

    sheetsSyncWorker.enqueue(
      'CustomRooms',
      {
        roomId: room.id,
        code: room.code,
        hostId: room.hostId,
        status: 'match_ended',
        updatedAt: new Date().toISOString()
      },
      `room_ended_${room.id}`
    );

    this.io.to(roomId).emit('match_finished', {
      winner,
      leaderboard: room.leaderboard,
      totalQuestions: room.currentRound,
      matchDurationMinutes: room.settings.matchDurationMinutes || 25,
      finalStageReached: room.currentStage || 1,
      stageName: room.stageName || 'Level 1: Easy'
    });
  }

  private updateLeaderboard(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const rewardsMap: Record<number, { coins: number; badge: string }> = {
      1: { coins: 15000, badge: '👑 Grand Champion' },
      2: { coins: 10000, badge: '🥈 Master Mind' },
      3: { coins: 7500, badge: '🥉 Apex Solver' },
      4: { coins: 4000, badge: '⚡ Blitz Veteran' },
      5: { coins: 3500, badge: '⚡ Blitz Veteran' },
      6: { coins: 3000, badge: '🔥 Top 10 Contender' },
      7: { coins: 2500, badge: '🔥 Top 10 Contender' },
      8: { coins: 2000, badge: '🔥 Top 10 Contender' },
      9: { coins: 1500, badge: '🔥 Top 10 Contender' },
      10: { coins: 1000, badge: '🔥 Top 10 Contender' }
    };

    const list = Object.values(room.participants)
      .map(p => ({
        id: p.id,
        username: p.username,
        score: p.score,
        rank: 1,
        combo: p.combo,
        isEliminated: p.isEliminated,
        correctCount: p.correctCount || 0,
        totalTimeTakenMs: p.totalTimeTakenMs || 0,
        avgTimeTakenSec: p.avgTimeTakenSec || 0,
        levelStats: p.levelStats || {},
        rewardCoins: 0,
        rewardBadge: ''
      }))
      .sort((a, b) => {
        if (a.isEliminated && !b.isEliminated) return 1;
        if (!a.isEliminated && b.isEliminated) return -1;
        // Primary: highest score (incorporating speed bonus)
        if (b.score !== a.score) return b.score - a.score;
        // Secondary: highest correct answers count
        if ((b.correctCount || 0) !== (a.correctCount || 0)) {
          return (b.correctCount || 0) - (a.correctCount || 0);
        }
        // Tertiary tiebreaker: lowest total time taken in ms (fastest solver wins!)
        return (a.totalTimeTakenMs || 0) - (b.totalTimeTakenMs || 0);
      });

    list.forEach((item, index) => {
      item.rank = index + 1;
      if (item.rank <= 10) {
        const rew = rewardsMap[item.rank] || { coins: 500, badge: '🎖️ Finalist' };
        item.rewardCoins = rew.coins;
        item.rewardBadge = rew.badge;
      }
    });

    room.leaderboard = list;
  }

  public getRoom(roomId: string): RoomState | undefined {
    return this.rooms.get(roomId);
  }

  public syncRoomState(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    this.io.to(roomId).emit('room_updated', room);
  }

  public clearRoomTimers(roomId: string): void {
    const t = this.roundTimers.get(roomId);
    if (t) {
      clearTimeout(t);
      this.roundTimers.delete(roomId);
    }

    const m = this.matchTimers.get(roomId);
    if (m) {
      clearTimeout(m);
      this.matchTimers.delete(roomId);
    }

    const bList = this.botTimers.get(roomId);
    if (bList) {
      bList.forEach(clearTimeout);
      this.botTimers.delete(roomId);
    }
  }
}
