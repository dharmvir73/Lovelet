import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { Pool } from 'pg';
import type { SurpriseContent } from './content';
export type Purchase = {
  id: string;
  email: string;
  content: string;
  password: string;
  edit_hash: string;
  slug: string | null;
  status: string;
  order_id: string | null;
  payment_id: string | null;
  created: number;
  paid: number | null;
  removed: number;
  refund_id: string | null;
  upload_hash: string;
};
const schema = `CREATE TABLE IF NOT EXISTS purchases (
 id TEXT PRIMARY KEY, email TEXT NOT NULL, content TEXT NOT NULL, password TEXT NOT NULL,
 edit_hash TEXT NOT NULL, upload_hash TEXT NOT NULL, slug TEXT UNIQUE, status TEXT NOT NULL DEFAULT 'draft',
 order_id TEXT UNIQUE, payment_id TEXT UNIQUE, created BIGINT NOT NULL, paid BIGINT, removed INTEGER NOT NULL DEFAULT 0, refund_id TEXT
);
CREATE TABLE IF NOT EXISTS photo_records (key TEXT PRIMARY KEY, purchase_id TEXT NOT NULL, created BIGINT NOT NULL);
CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, reset BIGINT NOT NULL);
CREATE TABLE IF NOT EXISTS mail_jobs (purchase_id TEXT PRIMARY KEY, edit_token TEXT NOT NULL, sent INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS events (name TEXT PRIMARY KEY, count BIGINT NOT NULL DEFAULT 0);`;
let sqlite: DatabaseSync | undefined;
let pool: Pool | undefined;
let initialized: Promise<void> | undefined;
async function init() {
  if (process.env.DATABASE_URL) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
    await pool.query(schema);
  } else {
    if (
      process.env.NODE_ENV === 'production' &&
      process.env.ALLOW_LOCAL_STORAGE !== 'true'
    )
      throw new Error('DATABASE_URL is required in production.');
    mkdirSync(
      resolve(/* turbopackIgnore: true */ process.env.DATA_DIR || '.data'),
      { recursive: true },
    );
    sqlite = new DatabaseSync(
      resolve(
        /* turbopackIgnore: true */ process.env.DATA_DIR || '.data',
        'lovelet.sqlite',
      ),
    );
    sqlite.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
    sqlite.exec(schema);
  }
}
export async function sql<T = Record<string, unknown>>(
  query: string,
  params: (string | number | null)[] = [],
): Promise<T[]> {
  await (initialized ??= init());
  if (pool) {
    let i = 0;
    return (
      await pool.query(
        query.replace(/\?/g, () => `$${++i}`),
        params,
      )
    ).rows;
  }
  const statement = sqlite!.prepare(query);
  if (/\bRETURNING\b/i.test(query) || /^\s*SELECT/i.test(query))
    return statement.all(...params) as T[];
  statement.run(...params);
  return [];
}
export async function purchase(id: string) {
  return (await sql<Purchase>('SELECT * FROM purchases WHERE id = ?', [id]))[0];
}
export const parseContent = (p: Purchase): SurpriseContent =>
  JSON.parse(p.content);
export async function rateLimit(
  key: string,
  limit: number,
  windowMs = 3600000,
) {
  const now = Date.now();
  const rows = await sql<{ count: number }>(
    `INSERT INTO rate_limits (key,count,reset) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count = CASE WHEN rate_limits.reset < ? THEN 1 ELSE rate_limits.count + 1 END, reset = CASE WHEN rate_limits.reset < ? THEN ? ELSE rate_limits.reset END RETURNING count`,
    [key, now + windowMs, now, now, now + windowMs],
  );
  if (Number(rows[0].count) > limit)
    throw new Error('Too many attempts. Please try again later.');
}
export async function track(name: string) {
  await sql(
    'INSERT INTO events (name,count) VALUES (?,1) ON CONFLICT(name) DO UPDATE SET count = events.count + 1',
    [name],
  );
}
