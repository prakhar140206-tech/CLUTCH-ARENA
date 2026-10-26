import pg from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { DSAOnboardingPreferences, ConceptMasteryRecord } from '../types/shared.js';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface PostgresConfig {
  connectionString?: string;
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  maxConnections?: number;
}

export class PostgresStorageAdapter {
  private pool: pg.Pool;
  private isConnected: boolean = false;

  constructor(config?: PostgresConfig) {
    const connStr = config?.connectionString || process.env.DATABASE_URL;
    this.pool = new Pool(
      connStr
        ? { connectionString: connStr, max: config?.maxConnections || 20, connectionTimeoutMillis: 3000 }
        : {
            host: config?.host || process.env.PGHOST || 'localhost',
            port: config?.port || Number(process.env.PGPORT) || 5432,
            user: config?.user || process.env.PGUSER || 'postgres',
            password: config?.password || process.env.PGPASSWORD || 'postgres',
            database: config?.database || process.env.PGDATABASE || 'clutch_db',
            max: config?.maxConnections || 20,
            connectionTimeoutMillis: 3000
          }
    );

    this.pool.on('error', (err) => {
      console.error('[Postgres] Unexpected pool error on idle client:', err.message);
    });
  }

  public async initialize(): Promise<boolean> {
    try {
      const client = await this.pool.connect();
      try {
        const schemaPath = path.join(__dirname, 'schema.sql');
        if (fs.existsSync(schemaPath)) {
          const sql = fs.readFileSync(schemaPath, 'utf-8');
          await client.query(sql);
        }
        this.isConnected = true;
        console.log('[Postgres] Successfully connected and schema verified.');
        return true;
      } finally {
        client.release();
      }
    } catch (err: any) {
      this.isConnected = false;
      console.warn('[Postgres] Connection initialization failed, falling back to JSON store:', err.message);
      return false;
    }
  }

  public getConnectedStatus(): boolean {
    return this.isConnected;
  }

  public async ping(): Promise<boolean> {
    try {
      const client = await this.pool.connect();
      try {
        await client.query('SELECT 1');
        this.isConnected = true;
        return true;
      } finally {
        client.release();
      }
    } catch {
      this.isConnected = false;
      return false;
    }
  }

  public async getUser(userId: string) {
    const res = await this.pool.query(
      `SELECT a.id, a.username, a.email, p.rating_mmr as "ratingMMR", p.aura_points as "auraPoints", 
              p.aura_title as "auraTitle", p.rank_tier as "rankTier", p.avatar_loadout as "avatar", 
              p.stats, p.last_active as "lastActive"
       FROM player_accounts a
       LEFT JOIN player_profiles p ON a.id = p.user_id
       WHERE a.id = $1`,
      [userId]
    );
    return res.rows[0];
  }

  public async upsertUser(user: {
    id: string;
    username: string;
    email?: string;
    passwordHash?: string;
    ratingMMR?: number;
    auraPoints?: number;
    auraTitle?: string;
    rankTier?: string;
    avatar?: any;
    stats?: any;
  }) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const now = Date.now();

      // Upsert account
      await client.query(
        `INSERT INTO player_accounts (id, username, email, password_hash, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $5)
         ON CONFLICT (id) DO UPDATE 
         SET username = EXCLUDED.username, 
             email = COALESCE(EXCLUDED.email, player_accounts.email), 
             updated_at = $5`,
        [user.id, user.username, user.email || null, user.passwordHash || null, now]
      );

      // Upsert profile
      await client.query(
        `INSERT INTO player_profiles (user_id, rating_mmr, aura_points, aura_title, rank_tier, avatar_loadout, stats, last_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (user_id) DO UPDATE 
         SET rating_mmr = COALESCE(EXCLUDED.rating_mmr, player_profiles.rating_mmr),
             aura_points = COALESCE(EXCLUDED.aura_points, player_profiles.aura_points),
             aura_title = COALESCE(EXCLUDED.aura_title, player_profiles.aura_title),
             rank_tier = COALESCE(EXCLUDED.rank_tier, player_profiles.rank_tier),
             avatar_loadout = COALESCE(EXCLUDED.avatar_loadout, player_profiles.avatar_loadout),
             stats = COALESCE(EXCLUDED.stats, player_profiles.stats),
             last_active = $8`,
        [
          user.id,
          user.ratingMMR || 1200,
          user.auraPoints || 5000,
          user.auraTitle || 'Novice Coder',
          user.rankTier || 'Byte Scout',
          JSON.stringify(user.avatar || {}),
          JSON.stringify(user.stats || { matchesPlayed: 0, matchesWon: 0, challengesSolved: 0, highestStreak: 0 }),
          now
        ]
      );

      await client.query('COMMIT');
      return await this.getUser(user.id);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Atomic Transaction: Records match outcome and adjusts winner ratings in a single ACID commit
   */
  public async recordMatchTransaction(match: {
    id: string;
    timestamp: number;
    mode: string;
    durationMs: number;
    winner: { id: string; username: string; score: number };
    participantsCount: number;
    leaderboardSnippet: any[];
  }) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const now = Date.now();

      // 1. Insert Match Record
      await client.query(
        `INSERT INTO match_records (id, timestamp, mode, duration_ms, winner_id, winner_username, winner_score, participants_count, leaderboard_snippet, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          match.id,
          match.timestamp,
          match.mode,
          match.durationMs,
          match.winner?.id || null,
          match.winner?.username || 'Nobody',
          match.winner?.score || 0,
          match.participantsCount,
          JSON.stringify(match.leaderboardSnippet || []),
          now
        ]
      );

      // 2. Adjust winner MMR & stats atomically
      if (match.winner && match.winner.id) {
        await client.query(
          `UPDATE player_profiles 
           SET rating_mmr = rating_mmr + 25,
               stats = jsonb_set(
                 jsonb_set(stats, '{matchesPlayed}', ((stats->>'matchesPlayed')::int + 1)::text::jsonb),
                 '{matchesWon}', ((stats->>'matchesWon')::int + 1)::text::jsonb
               ),
               last_active = $1
           WHERE user_id = $2`,
          [now, match.winner.id]
        );
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Record Quest Completion with Idempotent Double-Spend Protection
   */
  public async recordQuestCompletion(userId: string, challengeId: string, rewardCoins: number): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const now = Date.now();
      const insertRes = await client.query(
        `INSERT INTO quest_completions (id, user_id, challenge_id, completed_at, reward_coins)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id, challenge_id) DO NOTHING`,
        [`qc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, userId, challengeId, now, rewardCoins]
      );

      // If already recorded, rollback and return false (prevents duplicate rewards)
      if (insertRes.rowCount === 0) {
        await client.query('ROLLBACK');
        return false;
      }

      // Increment user challenges solved
      await client.query(
        `UPDATE player_profiles 
         SET aura_points = aura_points + $1,
             stats = jsonb_set(stats, '{challengesSolved}', ((stats->>'challengesSolved')::int + 1)::text::jsonb)
         WHERE user_id = $2`,
        [rewardCoins * 10, userId]
      );

      await client.query('COMMIT');
      return true;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  public async getGlobalLeaderboard(limit = 20) {
    const res = await this.pool.query(
      `SELECT a.id, a.username, p.rating_mmr as "ratingMMR", p.rank_tier as "rankTier", p.aura_title as "auraTitle"
       FROM player_accounts a
       JOIN player_profiles p ON a.id = p.user_id
       ORDER BY p.rating_mmr DESC
       LIMIT $1`,
      [limit]
    );
    return res.rows;
  }

  public async getMatchHistory(limit = 20) {
    const res = await this.pool.query(
      `SELECT id, timestamp, mode, duration_ms as "durationMs", winner_id as "winnerId", 
              winner_username as "winnerUsername", winner_score as "winnerScore", 
              participants_count as "participantsCount", leaderboard_snippet as "leaderboardSnippet"
       FROM match_records
       ORDER BY timestamp DESC
       LIMIT $1`,
      [limit]
    );
    return res.rows;
  }

  public async saveDSAPreferences(prefs: DSAOnboardingPreferences): Promise<void> {
    await this.pool.query(
      `INSERT INTO user_dsa_preferences (
        user_id, languages, experience_level, preferred_topics, preferred_formats, 
        goals, progression_pacing, diagnostic_score, assessed_level, completed_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (user_id) DO UPDATE SET
        languages = EXCLUDED.languages,
        experience_level = EXCLUDED.experience_level,
        preferred_topics = EXCLUDED.preferred_topics,
        preferred_formats = EXCLUDED.preferred_formats,
        goals = EXCLUDED.goals,
        progression_pacing = EXCLUDED.progression_pacing,
        diagnostic_score = EXCLUDED.diagnostic_score,
        assessed_level = EXCLUDED.assessed_level,
        completed_at = EXCLUDED.completed_at,
        updated_at = EXCLUDED.updated_at`,
      [
        prefs.userId,
        JSON.stringify(prefs.languages || ['python']),
        prefs.experienceLevel || 'beginner',
        JSON.stringify(prefs.preferredTopics || []),
        JSON.stringify(prefs.preferredFormats || []),
        JSON.stringify(prefs.goals || []),
        prefs.progressionPacing || 'steady',
        prefs.diagnosticScore || 0,
        prefs.assessedLevel || 'easy',
        prefs.completedAt || Date.now(),
        Date.now()
      ]
    );
  }

  public async getDSAPreferences(userId: string): Promise<DSAOnboardingPreferences | null> {
    const res = await this.pool.query(
      `SELECT user_id as "userId", languages, experience_level as "experienceLevel", 
              preferred_topics as "preferredTopics", preferred_formats as "preferredFormats",
              goals, progression_pacing as "progressionPacing", diagnostic_score as "diagnosticScore",
              assessed_level as "assessedLevel", completed_at as "completedAt"
       FROM user_dsa_preferences WHERE user_id = $1`,
      [userId]
    );
    return res.rows[0] || null;
  }

  public async updateConceptMastery(userId: string, record: ConceptMasteryRecord): Promise<void> {
    const id = `${userId}_${record.topic}`;
    await this.pool.query(
      `INSERT INTO user_concept_mastery (
        id, user_id, topic, mastery_score, current_difficulty, questions_attempted,
        questions_solved, recent_accuracy, avg_response_time_ms, consecutive_correct,
        consecutive_wrong, needs_remediation, remediation_step, last_updated
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (user_id, topic) DO UPDATE SET
        mastery_score = EXCLUDED.mastery_score,
        current_difficulty = EXCLUDED.current_difficulty,
        questions_attempted = EXCLUDED.questions_attempted,
        questions_solved = EXCLUDED.questions_solved,
        recent_accuracy = EXCLUDED.recent_accuracy,
        avg_response_time_ms = EXCLUDED.avg_response_time_ms,
        consecutive_correct = EXCLUDED.consecutive_correct,
        consecutive_wrong = EXCLUDED.consecutive_wrong,
        needs_remediation = EXCLUDED.needs_remediation,
        remediation_step = EXCLUDED.remediation_step,
        last_updated = EXCLUDED.last_updated`,
      [
        id,
        userId,
        record.topic,
        record.masteryScore,
        record.currentDifficulty,
        record.questionsAttempted,
        record.questionsSolved,
        record.recentAccuracy,
        record.averageResponseTimeMs,
        record.consecutiveCorrect,
        record.consecutiveWrong,
        record.needsRemediation,
        JSON.stringify(record.remediationStep || null),
        Date.now()
      ]
    );
  }

  public async getConceptMastery(userId: string): Promise<Record<string, ConceptMasteryRecord>> {
    const res = await this.pool.query(
      `SELECT topic, mastery_score as "masteryScore", current_difficulty as "currentDifficulty",
              questions_attempted as "questionsAttempted", questions_solved as "questionsSolved",
              recent_accuracy as "recentAccuracy", avg_response_time_ms as "averageResponseTimeMs",
              consecutive_correct as "consecutiveCorrect", consecutive_wrong as "consecutiveWrong",
              needs_remediation as "needsRemediation", remediation_step as "remediationStep",
              last_updated as "lastUpdated"
       FROM user_concept_mastery WHERE user_id = $1`,
      [userId]
    );
    const map: Record<string, ConceptMasteryRecord> = {};
    for (const row of res.rows) {
      map[row.topic] = row;
    }
    return map;
  }

  public async close(): Promise<void> {
    await this.pool.end();
  }
}
