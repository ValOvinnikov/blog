import { action } from 'storybook/actions';

/**
 * Storybook-only stand-in for `@web/utils/report-client-error` — the real
 * implementation POSTs to `/api/client-log` via `sendBeacon`/`fetch`, which
 * would fire a real network request on every render of an error-boundary
 * story (`.storybook/main.ts` aliases the exact specifier to this module).
 * Logs to the Actions panel instead, so a story still demonstrates that a
 * report *would* fire without ever issuing one.
 */
export function reportClientError(
  event: string,
  error: unknown,
  extra?: { digest?: string },
): void {
  action('reportClientError')(event, error, extra);
}
