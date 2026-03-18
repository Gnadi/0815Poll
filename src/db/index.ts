import { drizzle } from 'drizzle-orm/libsql';
import { createClient, type Client } from '@libsql/client';
import * as schema from './schema';

const isVercel = process.env.VERCEL === '1';
const url = process.env.TURSO_DATABASE_URL || (isVercel ? 'file:/tmp/polls.db' : 'file:data/polls.db');
const authToken = process.env.TURSO_AUTH_TOKEN;

if (isVercel && !process.env.TURSO_DATABASE_URL) {
  console.warn(
    '[0815Poll] WARNING: Running on Vercel without TURSO_DATABASE_URL. ' +
    'Using ephemeral /tmp storage — data will be lost between serverless invocations. ' +
    'Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN env vars for persistent storage.'
  );
}

let client: Client | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

function getClient() {
  if (!client) {
    client = createClient({
      url,
      ...(authToken ? { authToken } : {}),
    });
  }
  return client;
}

export function getDb() {
  if (!_db) {
    _db = drizzle(getClient(), { schema });
  }
  return _db;
}

// For convenience - lazy getter
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

async function initDb() {
  const c = getClient();
  const statements = [
    `CREATE TABLE IF NOT EXISTS polls (
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
    )`,
    `CREATE TABLE IF NOT EXISTS poll_options (
      id TEXT PRIMARY KEY,
      poll_id TEXT NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
      label TEXT NOT NULL,
      description TEXT,
      metadata TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS votes (
      id TEXT PRIMARY KEY,
      poll_id TEXT NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
      option_id TEXT NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
      voter_id TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS idx_poll_options_poll_id ON poll_options(poll_id)`,
    `CREATE INDEX IF NOT EXISTS idx_votes_poll_id ON votes(poll_id)`,
    `CREATE INDEX IF NOT EXISTS idx_votes_option_id ON votes(option_id)`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_votes_unique ON votes(poll_id, voter_id)`,
  ];
  await c.batch(statements.map(sql => ({ sql, args: [] })));
}

// Always re-run initDb on Vercel to handle fresh /tmp after cold starts
let _ready: Promise<void> | null = null;

export function ensureDb() {
  if (!_ready || isVercel) {
    _ready = initDb();
  }
  return _ready;
}
