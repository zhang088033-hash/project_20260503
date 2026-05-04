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

/** 经典 Supabase anon/service_role JWT 的 payload 里带有 `ref`（新 sb_secret_ 密钥不是 JWT，会跳过）。 */
function trySupabaseProjectRefFromJwt(token: string | undefined): string | undefined {
  if (!token?.trim()) {
    return undefined;
  }
  const t = token.trim();
  const parts = t.split('.');
  if (parts.length !== 3) {
    return undefined;
  }
  try {
    const json = Buffer.from(parts[1], 'base64url').toString('utf8');
    const payload = JSON.parse(json) as { ref?: string };
    const ref = payload.ref?.trim();
    return ref || undefined;
  } catch {
    try {
      const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const pad = b64.length % 4 ? 4 - (b64.length % 4) : 0;
      const json = Buffer.from(b64 + '='.repeat(pad), 'base64').toString('utf8');
      const payload = JSON.parse(json) as { ref?: string };
      const ref = payload.ref?.trim();
      return ref || undefined;
    } catch {
      return undefined;
    }
  }
}

function trySupabaseProjectRefFromApiKeyEnvs(): string | undefined {
  for (const key of [
    process.env.COZE_SUPABASE_SERVICE_ROLE_KEY,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.COZE_SUPABASE_ANON_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    process.env.SUPABASE_ANON_KEY,
  ]) {
    const ref = trySupabaseProjectRefFromJwt(key);
    if (ref) {
      return ref;
    }
  }
  return undefined;
}

/**
 * Supabase Pooler 要求用户名为 `postgres.<project_ref>`，仅用 `postgres` 会报 XX000 Tenant or user not found。
 */
function getSupabaseProjectRefForPooler(): string | undefined {
  const explicit = process.env.SUPABASE_PROJECT_REF?.trim();
  if (explicit) {
    return explicit;
  }

  const fromJwt = trySupabaseProjectRefFromApiKeyEnvs();
  if (fromJwt) {
    return fromJwt;
  }

  for (const raw of [
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.COZE_SUPABASE_URL,
    process.env.SUPABASE_URL,
  ]) {
    if (!raw?.trim()) continue;
    try {
      const host = new URL(raw.trim()).hostname.toLowerCase();
      const m = /^([a-z0-9]+)\.(?:supabase\.co|supabase\.com)$/i.exec(host);
      if (m) {
        return m[1];
      }
    } catch {
      /* ignore */
    }
  }

  try {
    const dbUrl = process.env.DATABASE_URL?.trim();
    if (!dbUrl) return undefined;
    const u = new URL(dbUrl);
    const host = u.hostname.toLowerCase();
    const fromHost = /^db\.([a-z0-9]+)\.(?:supabase\.co|supabase\.com)$/i.exec(host);
    if (fromHost) {
      return fromHost[1];
    }
  } catch {
    /* ignore */
  }

  return undefined;
}

function fixSupabasePoolerUsername(raw: string): string {
  const ref = getSupabaseProjectRefForPooler();
  if (!ref) {
    return raw;
  }

  try {
    const u = new URL(raw);
    if (!u.hostname.toLowerCase().includes('pooler.supabase.com')) {
      return raw;
    }
    const user = decodeURIComponent(u.username || '');
    if (user !== 'postgres') {
      return raw;
    }
    u.username = `postgres.${ref}`;
    return u.toString();
  } catch {
    return raw;
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
    return fixSupabasePoolerUsername(normalizePostgresUrl(dbUrl));
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
