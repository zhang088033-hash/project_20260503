import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

function getPostgresUrl(): string {
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    return dbUrl;
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

function getDbPool(): Pool {
  if (!pool) {
    const connectionString = getPostgresUrl();
    pool = new Pool({
      connectionString,
      ssl: process.env.DB_SSLMODE === 'require' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
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
