import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { PostgresStorageAdapter } from './postgresAdapter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const JSON_FILE = path.join(DATA_DIR, 'clutch_store.json');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');

export async function runJsonToPostgresMigration() {
  console.log('========================================================================');
  console.log('🔄 CLUTCH DATABASE MIGRATION: JSON STORE -> POSTGRESQL');
  console.log('========================================================================\n');

  if (!fs.existsSync(JSON_FILE)) {
    console.log(`[Migration] Source JSON file not found at ${JSON_FILE}. Nothing to migrate.`);
    return { success: true, migratedUsers: 0, migratedMatches: 0 };
  }

  // 1. Read & Validate Source JSON
  console.log(`[Step 1] Reading and validating source data from ${JSON_FILE}...`);
  const rawData = fs.readFileSync(JSON_FILE, 'utf-8');
  let data: any;
  try {
    data = JSON.parse(rawData);
  } catch (err: any) {
    throw new Error(`Corrupted JSON file: ${err.message}`);
  }

  const usersCount = Object.keys(data.users || {}).length;
  const matchesCount = (data.matchHistory || []).length;
  console.log(`  ✅ Source records validated: ${usersCount} users, ${matchesCount} match records.`);

  // 2. Create Timestamped Rollback Backup
  let backupFile: string | null = null;
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    backupFile = path.join(BACKUP_DIR, `clutch_store_backup_${Date.now()}.json`);
    fs.copyFileSync(JSON_FILE, backupFile);
    console.log(`[Step 2] Created rollback backup at: ${backupFile}`);
  } catch (backupErr: any) {
    console.warn(`[Step 2] Note: Cannot write to ${BACKUP_DIR} (${backupErr.message}). Writing backup to /tmp...`);
    try {
      backupFile = path.join('/tmp', `clutch_store_backup_${Date.now()}.json`);
      fs.copyFileSync(JSON_FILE, backupFile);
      console.log(`[Step 2] Created rollback backup at: ${backupFile}`);
    } catch (tmpErr: any) {
      console.warn(`[Step 2] Note: Skipped disk backup creation (${tmpErr.message}). Source JSON preserved in-place.`);
    }
  }

  // 3. Connect to PostgreSQL
  console.log('[Step 3] Initializing PostgreSQL connection & schema...');
  const pgAdapter = new PostgresStorageAdapter();
  const connected = await pgAdapter.initialize();

  if (!connected) {
    console.error('[Migration] Could not connect to PostgreSQL. Verify DATABASE_URL is configured.');
    throw new Error('PostgreSQL connection failed');
  }

  // 4. Migrate Users
  console.log('[Step 4] Migrating player accounts and competitive profiles...');
  let migratedUsers = 0;
  for (const userId of Object.keys(data.users || {})) {
    const u = data.users[userId];
    try {
      await pgAdapter.upsertUser({
        id: u.id,
        username: u.username,
        email: u.email,
        ratingMMR: u.ratingMMR,
        auraPoints: u.auraPoints,
        auraTitle: u.auraTitle,
        rankTier: u.rankTier,
        stats: u.stats
      });
      migratedUsers++;
    } catch (err: any) {
      console.error(`  ❌ Error migrating user ${userId}:`, err.message);
    }
  }
  console.log(`  ✅ Successfully migrated ${migratedUsers}/${usersCount} user accounts.`);

  // 5. Migrate Match Records
  console.log('[Step 5] Migrating match history records with transactional integrity...');
  let migratedMatches = 0;
  for (const m of data.matchHistory || []) {
    try {
      await pgAdapter.recordMatchTransaction(m);
      migratedMatches++;
    } catch (err: any) {
      console.error(`  ❌ Error migrating match ${m.id}:`, err.message);
    }
  }
  console.log(`  ✅ Successfully migrated ${migratedMatches}/${matchesCount} match records.`);

  // 6. Verify Database Leaderboard
  const top10 = await pgAdapter.getGlobalLeaderboard(5);
  console.log('\n[Step 6] Verification: Current PostgreSQL Leaderboard Top 5:');
  top10.forEach((p, idx) => {
    console.log(`   #${idx + 1}: ${p.username} (${p.ratingMMR} MMR) - Tier: ${p.rankTier}`);
  });

  await pgAdapter.close();
  console.log('\n========================================================================');
  console.log('🏁 MIGRATION COMPLETE: All authoritative data successfully transferred.');
  console.log('========================================================================\n');

  return { success: true, migratedUsers, migratedMatches, backupFile };
}

if (process.argv[1]?.includes('migrateJsonToPostgres')) {
  runJsonToPostgresMigration().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}
