import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import path from 'path';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

const dbPath = path.join(process.cwd(), 'data', 'polls.db');

// Ensure data directory exists
import fs from 'fs';
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });

// Auto-create tables if they don't exist
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS polls (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK(type IN ('standard', 'schedule', 'location', 'custom')),
    question TEXT NOT NULL,
    description TEXT,
    anonymous INTEGER NOT NULL DEFAULT 1,
    duration INTEGER NOT NULL DEFAULT 24,
    created_at TEXT NOT NULL,
    ends_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'ended')),
    creator_id TEXT
  );

  CREATE TABLE IF NOT EXISTS poll_options (
    id TEXT PRIMARY KEY,
    poll_id TEXT NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    description TEXT,
    metadata TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS votes (
    id TEXT PRIMARY KEY,
    poll_id TEXT NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    option_id TEXT NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
    voter_id TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_poll_options_poll_id ON poll_options(poll_id);
  CREATE INDEX IF NOT EXISTS idx_votes_poll_id ON votes(poll_id);
  CREATE INDEX IF NOT EXISTS idx_votes_option_id ON votes(option_id);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_votes_unique ON votes(poll_id, voter_id);
`);
