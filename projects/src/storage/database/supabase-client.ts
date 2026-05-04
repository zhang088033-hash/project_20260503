import dns from 'node:dns';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

let ipv4Preferred = false;

function preferIpv4First(): void {
  if (ipv4Preferred) return;
  ipv4Preferred = true;
  if (typeof dns.setDefaultResultOrder === 'function') {
    dns.setDefaultResultOrder('ipv4first');
  }
}

/** Supabase 托管库：补全 sslmode、PgBouncer 参数，减少 Vercel 上连库失败。 */
function normalizePostgresUrl(raw: string): string {
  const trimmed = raw.trim();
  const isSupabaseHost =
    /\.supabase\.co$/i.test(trimmed) ||
    /\.supabase\.com$/i.test(trimmed) ||
    /pooler\.supabase\.com/i.test(trimmed);

  if (!isSupabaseHost) {
    return trimmed;
  }

  try {
    const u = new URL(trimmed);
    if (!u.searchParams.get('sslmode')) {
      u.searchParams.set('sslmode', 'require');
    }
    if (u.hostname.includes('pooler.supabase.com') && !u.searchParams.get('pgbouncer')) {
      u.searchParams.set('pgbouncer', 'true');
    }
    return u.toString();
  } catch {
    return trimmed;
  }
}

function getPostgresUrl(): string {
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    return normalizePostgresUrl(dbUrl);
  }

  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || '5432';
  const database = process.env.DB_NAME || 'postgres';
  const user = process.env.DB_USER || 'postgres';
  const password = process.env.DB_PASSWORD || '';
  const sslmode = process.env.DB_SSLMODE || 'require';

  return `postgresql://${user}:${password}@${host}:${port}/${database}?sslmode=${sslmode}`;
}

let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

/**
 * node-pg 仅在配置里传入 `ssl` 时才会把 rejectUnauthorized 关掉。
 * 若连接串带 sslmode=require 却不传 `ssl`，仍会按系统 CA 校验，易触发 SELF_SIGNED_CERT_IN_CHAIN。
 */
/** 去掉连接串里的 TLS 参数，避免 pg 在 parse(connectionString) 时用 sslmode 覆盖 Pool 传入的 ssl。 */
function stripTlsQueryParams(connectionString: string): string {
  try {
    const u = new URL(connectionString);
    for (const key of [
      'sslmode',
      'sslrootcert',
      'sslcert',
      'sslkey',
      'sslcrl',
      'sslpassword',
    ]) {
      u.searchParams.delete(key);
    }
    return u.toString();
  } catch {
    return connectionString;
  }
}

function resolveSslConfig(connectionString: string): false | { rejectUnauthorized: boolean } {
  if (process.env.DB_SSLMODE?.toLowerCase() === 'disable') {
    return false;
  }

  try {
    const url = new URL(connectionString);
    const sslMode = url.searchParams.get('sslmode')?.toLowerCase() ?? '';
    const host = url.hostname.toLowerCase();
    const isLocal =
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host.endsWith('.local');

    if (sslMode === 'disable') {
      return false;
    }

    // 本机且无 sslmode：默认不走 TLS（本地 Postgres）
    if (isLocal && !sslMode) {
      return false;
    }

    // require / verify-* / prefer、或未写 sslmode 的远程主机：显式放宽链校验（Supabase/Vercel 常见）
    return { rejectUnauthorized: false };
  } catch {
    return { rejectUnauthorized: false };
  }
}

function getDbPool(): Pool {
  if (!pool) {
    preferIpv4First();
    const fullConnectionString = getPostgresUrl();
    const ssl = resolveSslConfig(fullConnectionString);
    const connectionString =
      ssl === false ? fullConnectionString : stripTlsQueryParams(fullConnectionString);
    pool = new Pool({
      connectionString,
      ...(ssl !== false ? { ssl: { rejectUnauthorized: false } } : {}),
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      keepAlive: true,
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      pool = null;
      db = null;
    });
  }
  return pool;
}

async function getDrizzleClient() {
  if (!db) {
    const pgPool = getDbPool();
    db = drizzle(pgPool);
  }
  return db;
}

export { getPostgresUrl, getDrizzleClient };
