import { io, Socket } from 'socket.io-client';
import { useGameStore } from '../store/gameStore.js';
import confetti from 'canvas-confetti';
import { SOCKET_URL } from '../config/api.js';
import { CLIENT_FALLBACK_CHALLENGES } from '../data/defaultChallenges.js';
import { soundSynth } from './soundSynth.js';

const SERVER_URL = SOCKET_URL;

class SocketService {
  private socket: Socket | null = null;
  private localRoom: any = null;
  private localCountdownTimer: any = null;
  private localBotTimer: any = null;

  public connect(): Socket {
    if (this.socket && this.socket.connected) return this.socket;

    try {
      this.socket = io(SERVER_URL, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 3,
        timeout: 4000
      });

      this.socket.on('connect', () => {
        console.log('[Socket] Connected to DSA Arena Server:', this.socket?.id);
        useGameStore.getState().setServerConnected(true);
      });

      this.socket.on('disconnect', () => {
        console.log('[Socket] Disconnected from DSA Arena Server');
        useGameStore.getState().setServerConnected(false);
      });

      this.socket.on('connect_error', () => {
        useGameStore.getState().setServerConnected(false);
      });

      this.socket.on('room_updated', (room) => {
        useGameStore.getState().setActiveRoom(room);
      });

      this.socket.on('match_countdown', ({ countdown }) => {
        useGameStore.getState().setCountdown(countdown);
      });

      this.socket.on('stage_transition', (data: { stage: any; stageName: string; difficulty: string; message: string; subtitle: string }) => {
        const room = useGameStore.getState().activeRoom;
        if (room) {
          useGameStore.getState().setActiveRoom({
            ...room,
            currentStage: data.stage,
            stageName: data.stageName
          });
        }
        useGameStore.getState().setStageAnnouncement(data);
      });

      this.socket.on('round_started', (data) => {
        useGameStore.getState().setCountdown(null);
        useGameStore.getState().setLastSubmissionResult(null);
        const room = useGameStore.getState().activeRoom;
        if (room) {
          useGameStore.getState().setActiveRoom({
            ...room,
            status: 'in_round',
            currentRound: data.roundIndex,
            activeChallenge: data.challenge,
            roundExpiresAt: data.expiresAt,
            matchExpiresAt: data.matchExpiresAt || room.matchExpiresAt,
            questionExpiresAt: data.questionExpiresAt || data.expiresAt,
            currentStage: data.stage || room.currentStage || 1,
            stageName: data.stageName || room.stageName || 'Level 1: Easy'
          });
        }
      });

      this.socket.on('round_ended', ({ roundIndex, leaderboard }) => {
        const room = useGameStore.getState().activeRoom;
        if (room) {
          useGameStore.getState().setActiveRoom({
            ...room,
            status: 'round_review',
            leaderboard
          });
        }
      });

      this.socket.on('match_finished', ({ winner, leaderboard }) => {
        const room = useGameStore.getState().activeRoom;
        if (room) {
          useGameStore.getState().setActiveRoom({
            ...room,
            status: 'match_ended',
            leaderboard
          });
        }
        const store = useGameStore.getState();
        const myId = store.userProfile.id;
        const isWinner = winner?.id === myId;
        const currentStats = store.userProfile.stats || {
          matchesPlayed: 0,
          matchesWon: 0,
          challengesSolved: 0,
          highestStreak: 0,
          topicsMastered: {}
        };

        store.updateUserProfile({
          ratingMMR: Math.max(800, (store.userProfile.ratingMMR || 1200) + (isWinner ? 25 : -10)),
          auraPoints: (store.userProfile.auraPoints || 0) + (isWinner ? 500 : 100),
          stats: {
            ...currentStats,
            matchesPlayed: currentStats.matchesPlayed + 1,
            matchesWon: isWinner ? currentStats.matchesWon + 1 : currentStats.matchesWon
          }
        });

        if (isWinner) {
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 }
          });
        }
      });

      this.socket.on('player_eliminated', ({ playerId, username }) => {
        console.log(`[Arena] Player eliminated: ${username} (${playerId})`);
      });

      this.socket.on('error_message', ({ message }) => {
        alert(`[Arena Error] ${message}`);
      });
    } catch (e) {
      console.warn('[Socket] Could not initialize socket client, fallback mode enabled.');
      useGameStore.getState().setServerConnected(false);
    }

    return this.socket as Socket;
  }

  public getSocket(): Socket {
    if (!this.socket) {
      return this.connect();
    }
    return this.socket;
  }

  public on(event: string, callback: (...args: any[]) => void): () => void {
    const socket = this.getSocket();
    if (socket) socket.on(event, callback);
    return () => socket && socket.off(event, callback);
  }

  public off(event: string, callback?: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  /**
   * Create Room with autonomous fallback when server is unreachable or static deployment
   */
  public createRoom(user: any, settings?: any): Promise<any> {
    return new Promise((resolve) => {
      let resolved = false;

      // Try server if connected
      if (this.socket && this.socket.connected) {
        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            resolve(this.createLocalRoom(user, settings));
          }
        }, 1200);

        this.socket.emit('create_room', { user, settings }, (res: any) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            if (res?.success) resolve(res.room);
            else resolve(this.createLocalRoom(user, settings));
          }
        });
      } else {
        resolve(this.createLocalRoom(user, settings));
      }
    });
  }

  private createLocalRoom(user: any, settings?: any): any {
    const localRoomId = `room_${Date.now()}`;
    const code = (settings?.code || Math.random().toString(36).substring(2, 7)).toUpperCase();
    const challenge = CLIENT_FALLBACK_CHALLENGES[Math.floor(Math.random() * CLIENT_FALLBACK_CHALLENGES.length)];
    const roundDurationSecs = settings?.roundDurationSeconds || settings?.questionDurationSeconds || 30;

    const hostParticipant: any = {
      id: user.id || 'user-pilot',
      username: user.username || 'Combatant',
      avatar: user.avatar || { color: '#8b5cf6', model: 'cube' },
      ratingMMR: user.ratingMMR || 1200,
      score: 0,
      combo: 0,
      maxCombo: 0,
      isBot: false,
      isHost: true,
      solved: 0,
      isReady: true,
      isEliminated: false,
      status: 'ready',
      rank: 1,
      loadout: user.avatar || {
        color: '#8b5cf6',
        visorGlow: '#c4b5fd',
        meshStyle: 'cyber_ninja',
        trailEffect: 'violet_matrix',
        emote: 'celebrate'
      }
    };

    const initialRoom: any = {
      id: localRoomId,
      code,
      name: settings?.name || 'CLUTCH Arena Battle',
      mode: settings?.mode || 'mega_arena_100',
      hostId: hostParticipant.id,
      status: 'lobby',
      currentRound: 1,
      totalRounds: settings?.totalRounds || 3,
      currentStage: 1,
      stageName: 'Stage 1: Core Algorithmic Sprint',
      participants: {
        [hostParticipant.id]: hostParticipant
      },
      leaderboard: [{
        id: hostParticipant.id,
        username: hostParticipant.username,
        score: 0,
        rank: 1,
        combo: 0,
        isEliminated: false
      }],
      activeChallenge: challenge,
      roundExpiresAt: Date.now() + roundDurationSecs * 1000,
      matchExpiresAt: Date.now() + (settings?.matchDurationMinutes || 10) * 60 * 1000,
      questionExpiresAt: Date.now() + roundDurationSecs * 1000,
      settings: settings || {
        maxPlayers: 10,
        totalRounds: 3,
        roundDurationSeconds: 30,
        mode: 'mega_arena_100',
        allowSpectators: false
      }
    };

    this.localRoom = initialRoom;
    useGameStore.getState().setActiveRoom(initialRoom as any);
    return initialRoom;
  }

  /**
   * Join Room with autonomous fallback
   */
  public joinRoom(roomCode: string, user: any): Promise<any> {
    return new Promise((resolve) => {
      let resolved = false;

      if (this.socket && this.socket.connected) {
        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            resolve(this.joinLocalRoom(roomCode, user));
          }
        }, 1200);

        this.socket.emit('join_room', { roomCode, user }, (res: any) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            if (res?.success) resolve(res.room);
            else resolve(this.joinLocalRoom(roomCode, user));
          }
        });
      } else {
        resolve(this.joinLocalRoom(roomCode, user));
      }
    });
  }

  private joinLocalRoom(roomCode: string, user: any): any {
    const room = this.localRoom || this.createLocalRoom(user, { code: roomCode, name: `Arena #${roomCode}` });
    const participant: any = {
      id: user.id || 'guest-combatant',
      username: user.username || 'Challenger',
      avatar: user.avatar || { color: '#06b6d4', model: 'sphere' },
      ratingMMR: user.ratingMMR || 1200,
      score: 0,
      combo: 0,
      maxCombo: 0,
      isBot: false,
      isHost: false,
      solved: 0,
      isReady: true,
      isEliminated: false,
      status: 'ready',
      rank: Object.keys(room.participants).length + 1,
      loadout: user.avatar || {
        color: '#06b6d4',
        visorGlow: '#67e8f9',
        meshStyle: 'neon_bot',
        trailEffect: 'electric_cyan',
        emote: 'wave'
      }
    };
    room.participants[participant.id] = participant;
    room.leaderboard = Object.values(room.participants).map((p: any, idx: number) => ({
      id: p.id,
      username: p.username,
      score: p.score || 0,
      rank: idx + 1,
      combo: p.combo || 0,
      isEliminated: false
    }));
    this.localRoom = room;
    useGameStore.getState().setActiveRoom({ ...room } as any);
    return room;
  }

  /**
   * Add AI Bot
   */
  public addBot(roomId: string, difficulty: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.socket && this.socket.connected) {
        this.socket.emit('add_bot', { roomId, difficulty }, (res: any) => {
          if (res?.success) {
            resolve(true);
            return;
          }
          this.addLocalBot(difficulty);
          resolve(true);
        });
      } else {
        this.addLocalBot(difficulty);
        resolve(true);
      }
    });
  }

  private addLocalBot(difficulty: string) {
    if (!this.localRoom) return;
    const botId = `bot_${Date.now()}`;
    const botNames = ['ByteBot [AI]', 'CyberKnight [AI]', 'AlgoRizz [AI]', 'GhostPointer [AI]'];
    const botName = botNames[Math.floor(Math.random() * botNames.length)];
    const botParticipant = {
      id: botId,
      username: botName,
      avatar: { color: '#06b6d4', model: 'robot' },
      ratingMMR: difficulty === 'hard' ? 1450 : 1240,
      score: 0,
      solved: 0,
      isReady: true,
      isEliminated: false,
      status: 'ready',
      isBot: true,
      rank: Object.keys(this.localRoom.participants).length + 1
    };
    this.localRoom.participants[botId] = botParticipant;
    this.localRoom.leaderboard = Object.values(this.localRoom.participants);
    useGameStore.getState().setActiveRoom({ ...this.localRoom });
  }

  public setReady(roomId: string, userId: string, isReady: boolean) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('set_ready', { roomId, userId, isReady });
    }
    if (this.localRoom && this.localRoom.participants[userId]) {
      this.localRoom.participants[userId].isReady = isReady;
      useGameStore.getState().setActiveRoom({ ...this.localRoom });
    }
  }

  /**
   * Start Match (Triggers 3-2-1 countdown and round start)
   */
  public startMatch(roomId: string, userId: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.socket && this.socket.connected) {
        this.socket.emit('start_match', { roomId, userId }, (res: any) => {
          if (res?.success) resolve(true);
          else resolve(this.startLocalMatch());
        });
      } else {
        resolve(this.startLocalMatch());
      }
    });
  }

  private startLocalMatch(): boolean {
    if (!this.localRoom) return false;

    // Trigger 3, 2, 1 Countdown
    useGameStore.getState().setCountdown(3);
    soundSynth.countdownBeep();
    let count = 3;
    clearInterval(this.localCountdownTimer);

    this.localCountdownTimer = setInterval(() => {
      count--;
      if (count > 0) {
        useGameStore.getState().setCountdown(count);
        soundSynth.countdownBeep();
      } else {
        clearInterval(this.localCountdownTimer);
        useGameStore.getState().setCountdown(null);
        soundSynth.matchStart();

        if (this.localRoom) {
          const roundDuration = this.localRoom.settings?.roundDurationSeconds || 30;
          this.localRoom.status = 'in_round';
          this.localRoom.roundExpiresAt = Date.now() + roundDuration * 1000;
          this.localRoom.questionExpiresAt = Date.now() + roundDuration * 1000;
          useGameStore.getState().setLastSubmissionResult(null);
          useGameStore.getState().setActiveRoom({ ...this.localRoom });

          // If Bot is in match, simulate bot solving after random delay
          const hasBot = Object.values(this.localRoom.participants).some((p: any) => p.isBot);
          if (hasBot) {
            clearTimeout(this.localBotTimer);
            const botDelayMs = 6000 + Math.random() * 8000;
            this.localBotTimer = setTimeout(() => {
              if (this.localRoom && this.localRoom.status === 'in_round') {
                const bot: any = Object.values(this.localRoom.participants).find((p: any) => p.isBot);
                if (bot) {
                  bot.score += 850;
                  bot.solved += 1;
                  this.localRoom.leaderboard = Object.values(this.localRoom.participants).sort((a: any, b: any) => b.score - a.score);
                  useGameStore.getState().setActiveRoom({ ...this.localRoom });
                }
              }
            }, botDelayMs);
          }
        }
      }
    }, 1000);

    return true;
  }

  /**
   * Submit Answer with local verification fallback
   */
  public submitAnswer(payload: any): Promise<any> {
    return new Promise((resolve) => {
      if (this.socket && this.socket.connected) {
        this.socket.emit('submit_answer', payload, (res: any) => {
          useGameStore.getState().setLastSubmissionResult(res);
          resolve(res);
        });
      } else {
        resolve(this.submitLocalAnswer(payload));
      }
    });
  }

  private submitLocalAnswer(payload: any): any {
    const room = this.localRoom || useGameStore.getState().activeRoom;
    if (!room || !room.activeChallenge) {
      return { success: false, isCorrect: false };
    }

    const challenge = room.activeChallenge;
    const cleanAnswer = typeof payload.answer === 'string' ? payload.answer.trim().toLowerCase() : JSON.stringify(payload.answer);
    const cleanExpected = typeof challenge.correctAnswer === 'string' ? challenge.correctAnswer.trim().toLowerCase() : JSON.stringify(challenge.correctAnswer);
    const isCorrect = cleanAnswer === cleanExpected;

    const timeTakenMs = payload.timeTakenMs || 2500;
    const speedBonus = isCorrect ? Math.max(50, Math.floor(500 - timeTakenMs / 40)) : 0;
    const scoreGain = isCorrect ? 1000 + speedBonus : 0;

    const myId = useGameStore.getState().userProfile.id;
    const user = room.participants[myId] || Object.values(room.participants)[0];
    if (user) {
      user.score = (user.score || 0) + scoreGain;
      if (isCorrect) user.solved = (user.solved || 0) + 1;
    }

    const res = {
      success: true,
      isCorrect,
      score: scoreGain,
      speedBonus,
      pointsAwarded: scoreGain,
      comboMultiplier: 1,
      totalScore: user ? user.score : scoreGain,
      feedback: challenge.explanation || (isCorrect ? 'Correct logic pattern!' : 'Algorithm mismatch'),
      explanation: challenge.explanation
    };

    useGameStore.getState().setLastSubmissionResult(res as any);
    if (isCorrect) {
      soundSynth.levelUp();
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    } else {
      soundSynth.vineBoom();
    }

    // Update Leaderboard
    room.leaderboard = Object.values(room.participants)
      .sort((a: any, b: any) => b.score - a.score)
      .map((p: any, idx: number) => ({ ...p, rank: idx + 1 }));

    // Move to round review
    setTimeout(() => {
      room.status = 'round_review';
      useGameStore.getState().setActiveRoom({ ...room });

      // Automatically transition to next round or finish
      setTimeout(() => {
        if (room.currentRound < room.totalRounds) {
          const nextChallenge = CLIENT_FALLBACK_CHALLENGES[room.currentRound % CLIENT_FALLBACK_CHALLENGES.length];
          room.currentRound += 1;
          room.activeChallenge = nextChallenge;
          room.status = 'in_round';
          const roundDur = room.settings?.roundDurationSeconds || 30;
          room.roundExpiresAt = Date.now() + roundDur * 1000;
          useGameStore.getState().setLastSubmissionResult(null);
          useGameStore.getState().setActiveRoom({ ...room });
        } else {
          // Finish match
          room.status = 'match_ended';
          const winner = room.leaderboard[0];
          useGameStore.getState().setActiveRoom({ ...room });
          const isWinner = winner?.id === myId;
          const currentStats = useGameStore.getState().userProfile.stats || { matchesPlayed: 0, matchesWon: 0, challengesSolved: 0, highestStreak: 0 };
          useGameStore.getState().updateUserProfile({
            ratingMMR: Math.max(800, (useGameStore.getState().userProfile.ratingMMR || 1200) + (isWinner ? 30 : -10)),
            auraPoints: (useGameStore.getState().userProfile.auraPoints || 0) + (isWinner ? 500 : 150),
            stats: {
              ...currentStats,
              matchesPlayed: currentStats.matchesPlayed + 1,
              matchesWon: isWinner ? currentStats.matchesWon + 1 : currentStats.matchesWon
            }
          });
          if (isWinner) {
            confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
          }
        }
      }, 5000);
    }, 1200);

    return res;
  }

  public updateLoadout(roomId: string, userId: string, loadout: any) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('update_loadout', { roomId, userId, loadout });
    }
  }

  public leaveRoom(roomId: string, userId: string) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('leave_room', { roomId, userId });
    }
    clearInterval(this.localCountdownTimer);
    clearTimeout(this.localBotTimer);
    this.localRoom = null;
    useGameStore.getState().setActiveRoom(null);
  }
}

export const socketService = new SocketService();
