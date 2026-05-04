import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const TASK_ATTACHMENTS_BUCKET = 'task-attachments';

let supabaseStorageClient: SupabaseClient | null = null;
let bucketEnsureReady = false;

/** 从 Supabase 的 Postgres 连接串推断项目 ref，得到 REST API 根地址（与控制台一致）。 */
export function inferSupabaseUrlFromDatabaseUrl(databaseUrl: string | undefined): string | undefined {
  if (!databaseUrl?.trim()) return undefined;
  const ref = extractSupabaseProjectRef(databaseUrl.trim());
  if (!ref) return undefined;
  return `https://${ref}.supabase.co`;
}

function extractSupabaseProjectRef(dbUrl: string): string | null {
  try {
    const u = new URL(dbUrl);
    const host = u.hostname.toLowerCase();
    const direct = /^db\.([a-z0-9]+)\.(?:supabase\.co|supabase\.com)$/i.exec(host);
    if (direct) return direct[1];

    const user = decodeURIComponent(u.username || '');
    const poolerUser = /^postgres\.([a-z0-9]+)$/i.exec(user);
    if (poolerUser) return poolerUser[1];

    return null;
  } catch {
    return null;
  }
}

function getStorageEnv() {
  const url =
    process.env.COZE_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    inferSupabaseUrlFromDatabaseUrl(process.env.DATABASE_URL) ||
    '';
  const serviceRoleKey =
    process.env.COZE_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    '';

  return { url, serviceRoleKey };
}

export function getSupabaseStorageClient(): SupabaseClient {
  const { url, serviceRoleKey } = getStorageEnv();

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Supabase Storage：请设置 SUPABASE_SERVICE_ROLE_KEY（或 COZE_SUPABASE_SERVICE_ROLE_KEY）；' +
        '若未设置 COZE_SUPABASE_URL，需使用 Supabase 的 DATABASE_URL 以便自动推断项目地址'
    );
  }

  if (!supabaseStorageClient) {
    supabaseStorageClient = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return supabaseStorageClient;
}

export async function ensureTaskAttachmentsBucket(): Promise<
  { ok: true } | { ok: false; message: string }
> {
  try {
    const supabase = getSupabaseStorageClient();
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      return { ok: false, message: listError.message };
    }
    if (buckets?.some((b) => b.name === TASK_ATTACHMENTS_BUCKET)) {
      return { ok: true };
    }

    const { error: createError } = await supabase.storage.createBucket(TASK_ATTACHMENTS_BUCKET, {
      public: false,
      fileSizeLimit: 52428800,
    });

    if (createError) {
      const msg = createError.message?.toLowerCase() ?? '';
      if (msg.includes('already') || msg.includes('exists')) {
        return { ok: true };
      }
      return { ok: false, message: createError.message };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

/** 成功后跳过 list/create，失败时不缓存以便下次重试。 */
export async function ensureTaskAttachmentsBucketOnce(): Promise<
  { ok: true } | { ok: false; message: string }
> {
  if (bucketEnsureReady) {
    return { ok: true };
  }
  const result = await ensureTaskAttachmentsBucket();
  if (result.ok) {
    bucketEnsureReady = true;
  }
  return result;
}
