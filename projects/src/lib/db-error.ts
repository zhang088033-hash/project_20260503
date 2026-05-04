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
      `${joined}。Supabase 连接池 (pooler.supabase.com) 需使用用户名 postgres.<项目ref>；` +
        `请在 Vercel 设置与控制台一致的 DATABASE_URL，或设置 NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co（或 SUPABASE_PROJECT_REF=<ref>）以便自动补全用户名。`
    );
  }

  return joined;
}
