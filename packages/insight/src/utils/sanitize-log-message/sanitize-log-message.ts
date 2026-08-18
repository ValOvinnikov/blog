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
  // only recognizes this literal regex idiom, not a per-character loop. Keep
  // this call as-is and chain further sanitization as additional `.replace`
  // calls rather than folding them into this character class.
  return (
    raw
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x1f\x7f]/g, ' ')
      .replace(/[\u2028\u2029]/g, ' ')
  ); // line/paragraph separators: unmatched above, unescaped by JSON.stringify
}
