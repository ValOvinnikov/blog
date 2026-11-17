import type { TValueOf } from '@shinefold/config/utils';

export const SUPPORT_FIELD_ERROR = {
  REQUIRED: 'REQUIRED',
  TOO_LONG: 'TOO_LONG',
} as const;

export type TSupportFieldError = TValueOf<typeof SUPPORT_FIELD_ERROR>;

export const SUPPORT_LIMIT = {
  SUBJECT_MAX_LENGTH: 150,
  MESSAGE_MAX_LENGTH: 5000,
  ORIGIN_PATH_MAX_LENGTH: 500,
  MESSAGES_PER_WINDOW: 5,
  WINDOW_MS: 60 * 60_000,
} as const;

export const SUPPORT_LOG = {
  ADDRESS_MISSING: 'support.address_missing',
  SEND_FAILED: 'support.send_failed',
  COPY_FAILED: 'support.copy_failed',
} as const;
