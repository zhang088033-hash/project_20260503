import { execSync } from 'child_process';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';

let envLoaded = false;

function loadEnv(): void {
  if (envLoaded) return;

  try {
    try {
      require('dotenv').config();
      envLoaded = true;
      return;
    } catch {
      // dotenv not available
    }

    const pythonCode = `
import os
import sys
try:
    from coze_workload_identity import Client
    client = Client()
    env_vars = client.get_project_env_vars()
    client.close()
    for env_var in env_vars:
        print(f"{env_var.key}={env_var.value}")
except Exception as e:
    print(f"# Error: {e}", file=sys.stderr)
`;

    const output = execSync(`python3 -c '${pythonCode.replace(/'/g, "'\"'\"'")}'`, {
      encoding: 'utf-8',
      timeout: 10000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const lines = output.trim().split('\n');
    for (const line of lines) {
      if (line.startsWith('#')) continue;
      const eqIndex = line.indexOf('=');
      if (eqIndex > 0) {
        const key = line.substring(0, eqIndex);
        let value = line.substring(eqIndex + 1);
        if ((value.startsWith("'") && value.endsWith("'")) ||
            (value.startsWith('"') && value.endsWith('"'))) {
          value = value.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }

    envLoaded = true;
  } catch {
    // Silently fail
  }
}

function getPostgresUrl(): string {
  loadEnv();

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

let client: Client | null = null;

function getDbClient(): Client {
  if (!client) {
    const connectionString = getPostgresUrl();
    client = new Client({
      connectionString,
      ssl: process.env.DB_SSLMODE === 'require' ? { rejectUnauthorized: false } : false,
    });
  }
  return client;
}

async function getDrizzleClient() {
  const dbClient = getDbClient();
  if (!dbClient._connected && !dbClient._connecting) {
    await dbClient.connect();
  }
  return drizzle(dbClient);
}

export { loadEnv, getPostgresUrl, getDbClient, getDrizzleClient };
