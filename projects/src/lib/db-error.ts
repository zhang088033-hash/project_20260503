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

  return parts.filter(Boolean).join(" | ");
}
