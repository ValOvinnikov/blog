import { sanitizeLogMessage } from '@blog/insight';
import { z } from 'zod';

// Static, lowercase, dot-namespaced — matches the shared logger's own event-
// name convention (see `@web/utils/logger/logger`'s callers) and doubles as
// a first line of defense: a value that doesn't match this shape never
// reaches `logger.error` at all.
const EVENT_NAME_PATTERN = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/;

// Kept in sync by hand with `@web/utils/report-client-error`'s own caps —
// see that file's comment for why these aren't a shared constant.
const MAX_EVENT_LENGTH = 80;
const MAX_MESSAGE_LENGTH = 500;
const MAX_STACK_LENGTH = 1000;
const MAX_URL_LENGTH = 2048;
const MAX_DIGEST_LENGTH = 100;
const MAX_USER_AGENT_LENGTH = 300;

/**
 * The fixed field set `/api/client-log` accepts. `.strict()` rejects any
 * extra key outright — arbitrary key passthrough on an unauthenticated
 * write endpoint would make it a log-injection amplifier, exactly the class
 * this endpoint exists to close out, not open back up.
 */
export const clientLogSchema = z
  .object({
    event: z.string().min(1).max(MAX_EVENT_LENGTH).regex(EVENT_NAME_PATTERN),
    message: z.string().min(1).max(MAX_MESSAGE_LENGTH),
    stack: z.string().max(MAX_STACK_LENGTH).optional(),
    url: z.string().max(MAX_URL_LENGTH).optional(),
    digest: z.string().max(MAX_DIGEST_LENGTH).optional(),
    userAgent: z.string().max(MAX_USER_AGENT_LENGTH).optional(),
  })
  .strict();

export type TClientLogPayload = z.infer<typeof clientLogSchema>;

const stripQueryString = (url: string): string => {
  return (url.split('#')[0] ?? '').split('?')[0] ?? '';
};

/**
 * Runs every string field through `sanitizeLogMessage` (strips control
 * characters and line/paragraph separators) and strips the query string and
 * fragment off `url`, regardless of what the client already did — this is
 * the last line of defense before the payload reaches the shared logger, so
 * it must not trust a request that skipped the browser-side reporter
 * entirely and posted here directly.
 */
export const sanitizeClientLogPayload = (
  payload: TClientLogPayload,
): TClientLogPayload => {
  return {
    event: payload.event,
    message: sanitizeLogMessage(payload.message),
    ...(payload.stack ? { stack: sanitizeLogMessage(payload.stack) } : {}),
    ...(payload.url
      ? { url: stripQueryString(sanitizeLogMessage(payload.url)) }
      : {}),
    ...(payload.digest ? { digest: sanitizeLogMessage(payload.digest) } : {}),
    ...(payload.userAgent
      ? { userAgent: sanitizeLogMessage(payload.userAgent) }
      : {}),
  };
};
