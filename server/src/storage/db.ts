import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { PostgresStorageAdapter } from './postgresAdapter.js';
import { DSAOnboardingPreferences, ConceptMasteryRecord, DSATopic } from '../types/shared.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'clutch_store.json');

const scryptAsync = (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: crypto.ScryptOptions
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, keylen, options, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(derivedKey as Buffer);
    });
  });
};

/**
 * Concurrency-bounded Scrypt Semaphore
 * Bounds concurrent password hashing threads to prevent event-loop & worker thread exhaustion
 */
class HashSemaphore {
  private active = 0;
  private queue: Array<() => void> = [];
  constructor(private maxConcurrent = 4) {}

  async acquire(): Promise<() => void> {
    if (this.active < this.maxConcurrent) {
      this.active++;
      return () => this.release();
    }
    return new Promise((resolve) => {
      this.queue.push(() => {
        this.active++;
        resolve(() => this.release());
      });
    });
  }

  private release() {
    this.active--;
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      if (next) next();
    }
  }
}

const hashLimiter = new HashSemaphore(4);

/**
 * Asynchronous Non-Blocking Password Security Utilities
 */
export async function hashPassword(password: string): Promise<string> {
  const release = await hashLimiter.acquire();
  try {
    const salt = crypto.randomBytes(16).toString('hex');
    const derivedKey = (await scryptAsync(password, salt, 64, {
      N: 16384,
      r: 8,
      p: 1,
      maxmem: 32 * 1024 * 1024
    })) as Buffer;
    return `${salt}:${derivedKey.toString('hex')}`;
  } finally {
    release();
  }
}

export async function verifyPassword(password: string, combinedHash: string): Promise<boolean> {
  const release = await hashLimiter.acquire();
  try {
    const [salt, key] = combinedHash.split(':');
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = (await scryptAsync(password, salt, 64, {
      N: 16384,
      r: 8,
      p: 1,
      maxmem: 32 * 1024 * 1024
    })) as Buffer;
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  } finally {
    release();
  }
}

export interface StoredUserProfile {
  id: string;
  username: string;
  email?: string;
  passwordHash?: string;
  ratingMMR: number;
  auraPoints: number;
  auraTitle: string;
  rankTier: string;
  stats: {
    matchesPlayed: number;
    matchesWon: number;
    challengesSolved: number;
    highestStreak: number;
  };
  lastActive: number;
}

export interface MatchRecord {
  id: string;
  timestamp: number;
  mode: string;
  durationMs: number;
  winner: { id: string; username: string; score: number };
  participantsCount: number;
  leaderboardSnippet: Array<{ id: string; username: string; score: number; rank: number }>;
}

export interface DatabaseSchema {
  users: Record<string, StoredUserProfile>;
  matchHistory: MatchRecord[];
  globalLeaderboard: Array<{ id: string; username: string; ratingMMR: number; rankTier: string }>;
  questCompletions?: Record<string, boolean>; // key: userId_challengeId
  dsaPreferences?: Record<string, DSAOnboardingPreferences>;
  conceptMastery?: Record<string, Record<string, ConceptMasteryRecord>>;
}

const DEFAULT_SEEDS: DatabaseSchema = {
  users: {},
  matchHistory: [],
  globalLeaderboard: [],
  questCompletions: {},
  dsaPreferences: {},
  conceptMastery: {}
};

/**
 * Unified Database Persistence Store
 *
 * Production Rules:
 * - Requires PostgreSQL.
 * - If PostgreSQL is unreachable in production, FAILS CLOSED (never silently falls back to local JSON file).
 * - Development/Test Mode: Uses local JSON file for zero-config local testing.
 */
export class PersistenceStore {
  private data: DatabaseSchema;
  private postgres: PostgresStorageAdapter | null = null;
  private usePostgres: boolean = false;
  private isProduction: boolean = process.env.NODE_ENV === 'production';
  private ready: boolean = false;
  private readinessError: string | null = null;

  constructor(options?: { isProduction?: boolean; usePostgres?: boolean; readinessError?: string; ready?: boolean }) {
    if (options?.isProduction !== undefined) this.isProduction = options.isProduction;
    if (options?.readinessError !== undefined) this.readinessError = options.readinessError;
    if (options?.usePostgres !== undefined) this.usePostgres = options.usePostgres;
    if (options?.ready !== undefined) this.ready = options.ready;

    this.data = this.loadFromDisk();
    this.updateLeaderboardCache();
    this.saveToDisk();
    if (!options) {
      this.initStorage();
    }
  }

  private async initStorage() {
    if (this.isProduction) {
      if (!process.env.DATABASE_URL) {
        this.ready = false;
        this.readinessError = 'DATABASE_URL is missing in production environment. PostgreSQL is mandatory.';
        console.error(`[Storage Error] ${this.readinessError}`);
        return;
      }
      try {
        this.postgres = new PostgresStorageAdapter();
        const connected = await this.postgres.initialize();
        if (connected) {
          this.usePostgres = true;
          this.ready = true;
          this.readinessError = null;
          console.log('[Storage] Production PostgreSQL database connected and verified.');
        } else {
          this.ready = false;
          this.readinessError = 'PostgreSQL database connection failed in production. Gating writes for data safety.';
          console.error(`[Storage Error] ${this.readinessError}`);
        }
      } catch (err: any) {
        this.ready = false;
        this.readinessError = `PostgreSQL initialization error: ${err.message}`;
        console.error(`[Storage Error] ${this.readinessError}`);
      }
    } else {
      // Development or test environment: local JSON store permitted
      if (process.env.DATABASE_URL) {
        try {
          this.postgres = new PostgresStorageAdapter();
          const connected = await this.postgres.initialize();
          if (connected) {
            this.usePostgres = true;
          }
        } catch {}
      }
      this.ready = true;
      this.readinessError = null;
    }
  }

  public getReadiness(): { ready: boolean; engine: string; error: string | null } {
    return {
      ready: this.ready,
      engine: this.usePostgres ? 'postgresql' : (this.isProduction ? 'disabled' : 'json_dev_fallback'),
      error: this.readinessError
    };
  }

  public async checkLiveReadiness(): Promise<{ ready: boolean; engine: string; error: string | null }> {
    if (this.isProduction) {
      if (!this.postgres) {
        return { ready: false, engine: 'disabled', error: 'PostgreSQL instance not configured in production' };
      }
      const alive = await this.postgres.ping();
      if (!alive) {
        return { ready: false, engine: 'postgresql', error: 'PostgreSQL database connection failed live health probe' };
      }
      return { ready: true, engine: 'postgresql', error: null };
    }
    return this.getReadiness();
  }

  public getStorageEngine(): 'postgresql' | 'json_fallback' | 'disabled' {
    if (this.usePostgres) return 'postgresql';
    if (this.isProduction) return 'disabled';
    return 'json_fallback';
  }

  private loadFromDisk(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw) as DatabaseSchema;
        const cleanUsers: Record<string, StoredUserProfile> = {};
        const testPrefixes = ['Contender_', 'Soak_', 'Phase6Agent_', 'HostAgent', 'GuestAgent', 'ArenaHost_', 'IntegrityTester', 'MatchChampion', 'AlphaLead', 'BetaRival', 'TournamentHost', 'Impostor', 'RealHost'];
        const fakeIds = ['user-001', 'user-002', 'user-003', 'host-auth-test', 'guest-impostor', 'pilot-alpha-1', 'pilot-beta-2', 'host-arena-lead'];

        for (const [id, u] of Object.entries(parsed.users || {})) {
          if (fakeIds.includes(id)) continue;
          if (testPrefixes.some(p => u.username.startsWith(p))) continue;
          if (id.startsWith('soak-') || id.startsWith('host-user-') || id.startsWith('player-') || id.startsWith('user_concurrent_') || id.startsWith('user_winner_')) continue;
          
          // Ensure auraPoints strictly reflects real user accomplishments
          if (u.auraPoints === 5000 || u.auraPoints === undefined) {
            u.auraPoints = ((u.stats?.matchesWon || 0) * 250) + ((u.stats?.challengesSolved || 0) * 100);
          }
          cleanUsers[id] = u;
        }

        parsed.users = cleanUsers;
        return parsed;
      }
    } catch (err: any) {
      console.warn('[Storage] Could not load DB file, initializing defaults:', err.message);
    }

    this.saveToDisk(DEFAULT_SEEDS);
    return JSON.parse(JSON.stringify(DEFAULT_SEEDS));
  }

  private saveToDisk(dataToSave: DatabaseSchema = this.data): void {
    if (this.isProduction && !this.usePostgres) {
      // In production, refuse to write to unverified local JSON file!
      return;
    }
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (err: any) {
      console.error('[Storage] Error persisting to disk:', err.message);
    }
  }

  public getUser(userId: string): StoredUserProfile | undefined {
    return this.data.users[userId];
  }

  public upsertUser(user: Partial<StoredUserProfile> & { id: string; username: string }): StoredUserProfile {
    if (this.isProduction && !this.usePostgres) {
      throw new Error(`DatabaseUnavailable: ${this.readinessError || 'Production PostgreSQL is not ready.'}`);
    }

    const existing = this.data.users[user.id] || {
      id: user.id,
      username: user.username,
      ratingMMR: 1200,
      auraPoints: 0,
      auraTitle: 'Novice Coder',
      rankTier: 'Byte Scout',
      stats: { matchesPlayed: 0, matchesWon: 0, challengesSolved: 0, highestStreak: 0 },
      lastActive: Date.now()
    };

    const updated: StoredUserProfile = {
      ...existing,
      ...user,
      stats: {
        ...existing.stats,
        ...(user.stats || {})
      },
      lastActive: Date.now()
    };

    this.data.users[user.id] = updated;
    this.updateLeaderboardCache();
    this.saveToDisk();

    if (this.usePostgres && this.postgres) {
      this.postgres.upsertUser(updated).catch(err => {
        console.warn('[Postgres] Async user sync error:', err.message);
      });
    }

    return updated;
  }

  public recordMatch(record: MatchRecord): boolean {
    if (this.isProduction && !this.usePostgres) {
      throw new Error(`DatabaseUnavailable: ${this.readinessError || 'Production PostgreSQL is not ready.'}`);
    }

    // Idempotency: verify this match hasn't already been processed
    if (this.data.matchHistory.some(m => m.id === record.id)) {
      return false; // Already recorded
    }

    this.data.matchHistory.unshift(record);
    if (this.data.matchHistory.length > 100) {
      this.data.matchHistory = this.data.matchHistory.slice(0, 100);
    }

    // Award winner MMR and stats
    if (record.winner && record.winner.id && this.data.users[record.winner.id]) {
      const u = this.data.users[record.winner.id];
      u.ratingMMR += 25;
      u.stats.matchesPlayed += 1;
      u.stats.matchesWon += 1;
      this.updateLeaderboardCache();
    }

    this.saveToDisk();

    if (this.usePostgres && this.postgres) {
      this.postgres.recordMatchTransaction(record).catch(err => {
        console.warn('[Postgres] Async match record error:', err.message);
      });
    }

    return true;
  }

  /**
   * Idempotent Solo Quest Reward Record (Prevents double claims)
   */
  public claimQuestReward(userId: string, challengeId: string, rewardCoins: number): { success: boolean; pointsAwarded: number } {
    if (this.isProduction && !this.usePostgres) {
      throw new Error(`DatabaseUnavailable: ${this.readinessError || 'Production PostgreSQL is not ready.'}`);
    }

    if (!this.data.questCompletions) this.data.questCompletions = {};
    const key = `${userId}_${challengeId}`;

    if (this.data.questCompletions[key]) {
      return { success: false, pointsAwarded: 0 }; // Already claimed!
    }

    this.data.questCompletions[key] = true;
    const user = this.data.users[userId];
    const pointsAwarded = rewardCoins * 10;
    if (user) {
      user.auraPoints += pointsAwarded;
      user.stats.challengesSolved += 1;
    }
    this.saveToDisk();

    if (this.usePostgres && this.postgres) {
      this.postgres.recordQuestCompletion(userId, challengeId, rewardCoins).catch(() => {});
    }

    return { success: true, pointsAwarded };
  }

  public getDSAPreferences(userId: string): DSAOnboardingPreferences | undefined {
    if (!this.data.dsaPreferences) this.data.dsaPreferences = {};
    return this.data.dsaPreferences[userId];
  }

  public saveDSAPreferences(prefs: DSAOnboardingPreferences): DSAOnboardingPreferences {
    if (this.isProduction && !this.usePostgres) {
      throw new Error(`DatabaseUnavailable: ${this.readinessError || 'Production PostgreSQL is not ready.'}`);
    }
    if (!this.data.dsaPreferences) this.data.dsaPreferences = {};
    const updated: DSAOnboardingPreferences = {
      ...prefs,
      completedAt: prefs.completedAt || Date.now()
    };
    this.data.dsaPreferences[prefs.userId] = updated;
    this.saveToDisk();

    if (this.usePostgres && this.postgres) {
      this.postgres.saveDSAPreferences(updated).catch(err => {
        console.warn('[Postgres] Async save preferences error:', err.message);
      });
    }
    return updated;
  }

  public getConceptMastery(userId: string): Record<string, ConceptMasteryRecord> {
    if (!this.data.conceptMastery) this.data.conceptMastery = {};
    return this.data.conceptMastery[userId] || {};
  }

  public updateConceptMastery(userId: string, record: ConceptMasteryRecord): ConceptMasteryRecord {
    if (this.isProduction && !this.usePostgres) {
      throw new Error(`DatabaseUnavailable: ${this.readinessError || 'Production PostgreSQL is not ready.'}`);
    }
    if (!this.data.conceptMastery) this.data.conceptMastery = {};
    if (!this.data.conceptMastery[userId]) this.data.conceptMastery[userId] = {};

    this.data.conceptMastery[userId][record.topic] = {
      ...record,
      lastUpdated: Date.now()
    };
    this.saveToDisk();

    if (this.usePostgres && this.postgres) {
      this.postgres.updateConceptMastery(userId, record).catch(err => {
        console.warn('[Postgres] Async update mastery error:', err.message);
      });
    }
    return this.data.conceptMastery[userId][record.topic];
  }

  public getGlobalLeaderboard(limit = 20) {
    return this.data.globalLeaderboard.slice(0, limit);
  }

  public getMatchHistory(limit = 20) {
    return this.data.matchHistory.slice(0, limit);
  }

  public updateLeaderboardCache(): void {
    const sorted = Object.values(this.data.users)
      .sort((a, b) => b.ratingMMR - a.ratingMMR || (b.stats?.challengesSolved || 0) - (a.stats?.challengesSolved || 0))
      .map(u => ({
        id: u.id,
        username: u.username,
        ratingMMR: u.ratingMMR,
        rankTier: u.rankTier,
        auraPoints: u.auraPoints || 0,
        solved: u.stats?.challengesSolved || 0,
        matchesPlayed: u.stats?.matchesPlayed || 0,
        matchesWon: u.stats?.matchesWon || 0,
        highestStreak: u.stats?.highestStreak || 0
      }));
    this.data.globalLeaderboard = sorted;
  }
}

export const persistenceStore = new PersistenceStore();
