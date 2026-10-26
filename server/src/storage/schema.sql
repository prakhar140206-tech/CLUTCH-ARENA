-- ============================================================================
-- CLUTCH COMPETITIVE DSA PLATFORM — PRODUCTION POSTGRESQL SCHEMA
-- ============================================================================

-- 1. Player Accounts Table
CREATE TABLE IF NOT EXISTS player_accounts (
    id VARCHAR(64) PRIMARY KEY,
    username VARCHAR(64) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL
);

-- 2. Player Profiles Table
CREATE TABLE IF NOT EXISTS player_profiles (
    user_id VARCHAR(64) PRIMARY KEY REFERENCES player_accounts(id) ON DELETE CASCADE,
    rating_mmr INT NOT NULL DEFAULT 1200,
    aura_points INT NOT NULL DEFAULT 5000,
    aura_title VARCHAR(128) NOT NULL DEFAULT 'Novice Coder',
    rank_tier VARCHAR(64) NOT NULL DEFAULT 'Byte Scout',
    avatar_loadout JSONB NOT NULL DEFAULT '{"color": "#8b5cf6", "visorGlow": "#06b6d4", "meshStyle": "cyber_ninja"}'::jsonb,
    stats JSONB NOT NULL DEFAULT '{"matchesPlayed": 0, "matchesWon": 0, "challengesSolved": 0, "highestStreak": 0}'::jsonb,
    last_active BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_player_profiles_mmr ON player_profiles (rating_mmr DESC);

-- 3. Match Records Table
CREATE TABLE IF NOT EXISTS match_records (
    id VARCHAR(64) PRIMARY KEY,
    timestamp BIGINT NOT NULL,
    mode VARCHAR(64) NOT NULL,
    duration_ms INT NOT NULL DEFAULT 0,
    winner_id VARCHAR(64) REFERENCES player_accounts(id) ON DELETE SET NULL,
    winner_username VARCHAR(64),
    winner_score INT NOT NULL DEFAULT 0,
    participants_count INT NOT NULL DEFAULT 1,
    leaderboard_snippet JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_match_records_timestamp ON match_records (timestamp DESC);

-- 4. Quest Completions & Idempotent Rewards
CREATE TABLE IF NOT EXISTS quest_completions (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES player_accounts(id) ON DELETE CASCADE,
    challenge_id VARCHAR(64) NOT NULL,
    completed_at BIGINT NOT NULL,
    reward_coins INT NOT NULL DEFAULT 0,
    CONSTRAINT uq_user_challenge UNIQUE (user_id, challenge_id)
);

CREATE INDEX IF NOT EXISTS idx_quest_user ON quest_completions (user_id);

-- 5. Submission Idempotency Keys (Deduplication boundary)
CREATE TABLE IF NOT EXISTS idempotency_keys (
    key VARCHAR(128) PRIMARY KEY,
    created_at BIGINT NOT NULL,
    result JSONB NOT NULL
);
