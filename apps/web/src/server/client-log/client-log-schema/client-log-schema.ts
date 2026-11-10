import { sanitizeLogMessage } from '@blog/insight';
import {
  MAX_MESSAGE_LENGTH,
  MAX_STACK_LENGTH,
  MAX_USER_AGENT_LENGTH,
} from '@web/constants/client-log';
import { z } from 'zod';

const EVENT_NAME_PATTERN = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/;

const MAX_EVENT_LENGTH = 80;
const MAX_URL_LENGTH = 2048;
const MAX_DIGEST_LENGTH = 100;

// `.strict()`: passing unknown keys through an unauthenticated write endpoint would invite log injection.
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

/** Re-sanitizes every field whatever the client did — a request may skip the browser reporter entirely. */
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
