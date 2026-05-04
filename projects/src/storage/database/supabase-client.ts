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

function resolveSslConfig(connectionString: string): false | { rejectUnauthorized: boolean } | undefined {
  const envSslMode = process.env.DB_SSLMODE;
  if (envSslMode) {
    return envSslMode === 'require' || envSslMode === 'verify-full'
      ? { rejectUnauthorized: false }
      : false;
  }

  try {
    const url = new URL(connectionString);
    const sslMode = url.searchParams.get('sslmode');
    const host = url.hostname.toLowerCase();
    const looksRemote =
      host !== 'localhost' &&
      host !== '127.0.0.1' &&
      !host.endsWith('.local');

    if (!sslMode) {
      return looksRemote ? { rejectUnauthorized: false } : undefined;
    }

    if (sslMode === 'disable') {
      return false;
    }

    // Supabase/Neon 常用 sslmode=require，Vercel 环境下通常需要允许证书链兼容。
    return { rejectUnauthorized: false };
  } catch {
    return undefined;
  }
}

function getDbPool(): Pool {
  if (!pool) {
    preferIpv4First();
    const connectionString = getPostgresUrl();
    const ssl = resolveSslConfig(connectionString);
    pool = new Pool({
      connectionString,
      ...(ssl !== undefined ? { ssl } : {}),
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
