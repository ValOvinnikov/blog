import type { TMaybeUndefined } from '@blog/config';
import { HTTP_METHOD } from '@blog/config/constants';
import { isString } from '@blog/utils/primitives';
import {
  MAX_MESSAGE_LENGTH,
  MAX_STACK_LENGTH,
  MAX_USER_AGENT_LENGTH,
} from '@web/constants/client-log';

const CLIENT_LOG_ENDPOINT = '/api/client-log';

const MAX_STACK_LINES = 20;
// Circuit breaker against an error-boundary render loop; resets on each full page load.
const MAX_REPORTS_PER_PAGE_LOAD = 5;

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

const resolveMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : String(error);
};

// Asset URLs in a stack can carry session query strings that must never leave the browser.
const sanitizeStack = (stack: string): string => {
  return stack
    .split('\n')
    .slice(0, MAX_STACK_LINES)
    .join('\n')
    .replace(/\?[^\s)]*/g, '')
    .slice(0, MAX_STACK_LENGTH);
};

const resolveUrl = (): TMaybeUndefined<string> => {
  if (typeof window === 'undefined') return undefined;

  return window.location.pathname;
};

const send = (payload: TClientLogPayload): void => {
  const body = JSON.stringify(payload);

  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    const blob = new Blob([body], { type: 'application/json' });
    const queued = navigator.sendBeacon(CLIENT_LOG_ENDPOINT, blob);
    if (queued) return;
  }

  if (typeof fetch !== 'function') return;

  // A failed report must never surface as an unhandled rejection in the error path it reports on.
  fetch(CLIENT_LOG_ENDPOINT, {
    method: HTTP_METHOD.POST,
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {});
};

/** Reports a browser failure to `/api/client-log` — call it alongside the shared `logger`, never instead of it. */
export const reportClientError = (
  event: string,
  error: unknown,
  extra?: { digest?: string },
): void => {
  if (typeof window === 'undefined') return;
  if (reportCount >= MAX_REPORTS_PER_PAGE_LOAD) return;

  const message = resolveMessage(error).slice(0, MAX_MESSAGE_LENGTH);
  const fingerprint = `${event}::${message}`;
  if (seenFingerprints.has(fingerprint)) return;

  seenFingerprints.add(fingerprint);
  reportCount += 1;

  const stack =
    error instanceof Error && isString(error.stack)
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
};
