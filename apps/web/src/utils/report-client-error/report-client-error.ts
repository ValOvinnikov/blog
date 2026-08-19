const CLIENT_LOG_ENDPOINT = '/api/client-log';

// Kept in sync by hand with `@web/server/client-log/client-log-schema`'s
// caps — a client module can't import that server-only file without pulling
// it into the browser bundle, so the two live as separately-documented
// literals rather than a shared constant.
const MAX_MESSAGE_LENGTH = 500;
const MAX_STACK_LENGTH = 1000;
const MAX_STACK_LINES = 20;
const MAX_USER_AGENT_LENGTH = 300;

// Hard stop after this many reports in one page load — the circuit breaker
// that protects the endpoint from an error-boundary render loop hammering
// it. Module-scoped state, so it resets on every full page load/navigation
// and is shared across every `reportClientError` caller on the page.
// Exported so the test suite can pin the exact cap instead of duplicating
// it as a magic number.
export const MAX_REPORTS_PER_PAGE_LOAD = 5;

const seenFingerprints = new Set<string>();
let reportCount = 0;

type TClientLogPayload = {
  event: string;
  message: string;
  stack?: string;
  url?: string;
  digest?: string;
  userAgent?: string;
};

function resolveMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

// Strips anything from a `?` onward on every line — source-map/asset URLs
// inside a stack frequently carry cache-busting or session query strings
// that must never leave the browser, and truncates to a bounded size so one
// giant stack can't itself blow the endpoint's payload cap.
function sanitizeStack(stack: string): string {
  return stack
    .split('\n')
    .slice(0, MAX_STACK_LINES)
    .join('\n')
    .replace(/\?[^\s)]*/g, '')
    .slice(0, MAX_STACK_LENGTH);
}

function resolveUrl(): string | undefined {
  if (typeof window === 'undefined') return undefined;

  return window.location.pathname;
}

function send(payload: TClientLogPayload): void {
  const body = JSON.stringify(payload);

  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    const blob = new Blob([body], { type: 'application/json' });
    const queued = navigator.sendBeacon(CLIENT_LOG_ENDPOINT, blob);
    if (queued) return;
  }

  if (typeof fetch !== 'function') return;

  // Fire-and-forget: nothing downstream reads the response, and a failed
  // report must never surface as an unhandled rejection in the very error
  // path it's trying to report on.
  fetch(CLIENT_LOG_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {});
}

/**
 * The browser-side counterpart to the shared `logger` — call it alongside
 * (never instead of) `logger.error`/`logger.warn` at a client catch site or
 * error-boundary mount to also report the failure to `/api/client-log`.
 * Deduplicates by `event`+message fingerprint and hard-stops after
 * `MAX_REPORTS_PER_PAGE_LOAD` reports, both scoped to the current page load.
 */
export function reportClientError(
  event: string,
  error: unknown,
  extra?: { digest?: string },
): void {
  if (typeof window === 'undefined') return;
  if (reportCount >= MAX_REPORTS_PER_PAGE_LOAD) return;

  const message = resolveMessage(error).slice(0, MAX_MESSAGE_LENGTH);
  const fingerprint = `${event}::${message}`;
  if (seenFingerprints.has(fingerprint)) return;

  seenFingerprints.add(fingerprint);
  reportCount += 1;

  const stack =
    error instanceof Error && typeof error.stack === 'string'
      ? sanitizeStack(error.stack)
      : undefined;
  const url = resolveUrl();
  const userAgent =
    typeof navigator !== 'undefined'
      ? navigator.userAgent.slice(0, MAX_USER_AGENT_LENGTH)
      : undefined;

  send({
    event,
    message,
    ...(stack ? { stack } : {}),
    ...(url ? { url } : {}),
    ...(extra?.digest ? { digest: extra.digest } : {}),
    ...(userAgent ? { userAgent } : {}),
  });
}
