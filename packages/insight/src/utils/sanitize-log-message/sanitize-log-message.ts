/**
 * Strips newline and other control characters from a caught error before it
 * reaches a server log line. `console.error`/`console.warn` calls that log a
 * raw `Error`/`unknown` catch value verbatim let an attacker-influenced
 * message (e.g. a caller-supplied ID a downstream query echoes back in its
 * thrown error) inject `\r`/`\n`/control sequences into log output and forge
 * fake log entries (CodeQL `js/log-injection`). Always run a caught value
 * through this before logging it.
 */
export function sanitizeLogMessage(value: unknown): string {
  const raw = value instanceof Error ? value.message : String(value);

  // Control-character range is intentional: CodeQL's log-injection sanitizer
  // only recognizes this literal regex idiom, not a per-character loop.
  // eslint-disable-next-line no-control-regex
  return raw.replace(/[\x00-\x1f\x7f]/g, ' ');
}
