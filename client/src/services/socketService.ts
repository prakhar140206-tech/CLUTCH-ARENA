import { io, Socket } from 'socket.io-client';
import { useGameStore } from '../store/gameStore.js';
import confetti from 'canvas-confetti';
import { SOCKET_URL } from '../config/api';

const SERVER_URL = SOCKET_URL;

class SocketService {
  private socket: Socket | null = null;

  public connect(): Socket {
    if (this.socket && this.socket.connected) return this.socket;

    this.socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      timeout: 10000
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

    return this.socket;
  }

  public getSocket(): Socket {
    if (!this.socket) {
      return this.connect();
    }
    return this.socket;
  }

  public createRoom(user: any, settings?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getSocket().emit('create_room', { user, settings }, (res: any) => {
        if (res?.success) resolve(res.room);
        else reject(new Error(res?.error || 'Failed to create room'));
      });
    });
  }

  public joinRoom(roomCode: string, user: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getSocket().emit('join_room', { roomCode, user }, (res: any) => {
        if (res?.success) resolve(res.room);
        else reject(new Error(res?.error || 'Failed to join room'));
      });
    });
  }

  public addBot(roomId: string, difficulty: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.getSocket().emit('add_bot', { roomId, difficulty }, (res: any) => {
        resolve(res?.success || false);
      });
    });
  }

  public setReady(roomId: string, userId: string, isReady: boolean) {
    this.getSocket().emit('set_ready', { roomId, userId, isReady });
  }

  public startMatch(roomId: string, userId: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.getSocket().emit('start_match', { roomId, userId }, (res: any) => {
        resolve(res?.success || false);
      });
    });
  }

  public submitAnswer(payload: any): Promise<any> {
    return new Promise((resolve) => {
      this.getSocket().emit('submit_answer', payload, (res: any) => {
        useGameStore.getState().setLastSubmissionResult(res);
        resolve(res);
      });
    });
  }

  public updateLoadout(roomId: string, userId: string, loadout: any) {
    this.getSocket().emit('update_loadout', { roomId, userId, loadout });
  }

  public leaveRoom(roomId: string, userId: string) {
    this.getSocket().emit('leave_room', { roomId, userId });
    useGameStore.getState().setActiveRoom(null);
  }
}

export const socketService = new SocketService();
