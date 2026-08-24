/**
 * Strips newline and other control characters from a caught error before it
 * reaches a log line — a raw `Error`/`unknown` catch value logged verbatim
 * lets an attacker-influenced message inject `\r`/`\n`/control sequences into
 * log output and forge fake log entries. Always run a caught value through
 * this before logging it or persisting it as a step's error message.
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
