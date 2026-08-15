/**
 * Strips newline and other control characters from a caught error before it
 * reaches a log line — a raw `Error`/`unknown` catch value logged verbatim
 * lets an attacker-influenced message inject `\r`/`\n`/control sequences into
 * log output and forge fake log entries. Always run a caught value through
 * this before logging or sending it in a status-callback payload.
 *
 * Duplicated from `apps/admin/src/utils/sanitize-log-message/sanitize-log-message.ts`
 * — this script can't import across the app/package boundary. The two copies
 * should fold into a shared `@blog/utils` export instead; flagged as a
 * follow-up, not done here (out of this ticket's scope).
 */
export function sanitizeLogMessage(value: unknown): string {
  const raw = value instanceof Error ? value.message : String(value);

  return Array.from(raw)
    .map((char) => {
      const codePoint = char.codePointAt(0) ?? 0;
      return codePoint < 0x20 || codePoint === 0x7f ? ' ' : char;
    })
    .join('');
}
