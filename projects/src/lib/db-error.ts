/** DrizzleQueryError 等会把底层 pg 错误放在 `cause` 上，便于排障。 */
export function formatDatabaseError(error: unknown): string {
  if (!(error instanceof Error)) {
    return String(error);
  }

  const parts: string[] = [error.message];
  const cause = (error as Error & { cause?: unknown }).cause;

  if (cause instanceof Error) {
    parts.push(cause.message);
    const code = (cause as NodeJS.ErrnoException & { code?: string }).code;
    if (code) {
      parts.push(`code=${code}`);
    }
  } else if (cause && typeof cause === "object" && "message" in cause) {
    parts.push(String((cause as { message: unknown }).message));
  }

  const joined = parts.filter(Boolean).join(" | ");

  if (
    /Tenant or user not found/i.test(joined) ||
    (joined.includes("XX000") && /tenant|user not found/i.test(joined))
  ) {
    return (
      `${joined}。Supabase 连接池需使用用户名 postgres.<项目ref>（与控制台 Connection string 一致）。` +
        `请在 Vercel 设置 NEXT_PUBLIC_SUPABASE_URL、或 SUPABASE_PROJECT_REF；若仍使用 JWT 形式的 anon/service_role 密钥，部署最新代码后会自动从密钥解析 ref。` +
        `若密钥已是 sb_secret_ / sb_publishable_ 格式，请手动设置 SUPABASE_PROJECT_REF。`
    );
  }

  return joined;
}
