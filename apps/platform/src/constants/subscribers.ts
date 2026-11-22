import type { TValueOf } from '@shinefold/config/utils';

export const SUBSCRIBERS_SEARCH_PARAM = {
  MOVED_UP: 'MOVED_UP',
} as const;

export const SUBSCRIBERS_PAGE_SIZE = 25;

export const SUBSCRIBERS_EXPORT_FILE_PREFIX = 'subscribers';

export const SUBSCRIBERS_CSV_HEADER = ['email', 'confirmed_at'] as const;

export const SUBSCRIBER_LIMIT_STATE = {
  UNDER: 'UNDER',
  NEAR: 'NEAR',
  PAUSED: 'PAUSED',
} as const;

export type TSubscriberLimitState = TValueOf<typeof SUBSCRIBER_LIMIT_STATE>;

export const SUBSCRIBERS_NOTICE = {
  OPERATOR_PAUSE: 'OPERATOR_PAUSE',
  BAND_PAUSED: 'BAND_PAUSED',
  EMAILS_PAUSED: 'EMAILS_PAUSED',
  BAND_NEAR: 'BAND_NEAR',
  EMAILS_NEAR: 'EMAILS_NEAR',
  MOVED_UP: 'MOVED_UP',
} as const;

export type TSubscribersNotice = TValueOf<typeof SUBSCRIBERS_NOTICE>;

export const SUBSCRIBERS_REFUSAL = {
  NOT_FOUND: 'NOT_FOUND',
} as const;

export const SUBSCRIBERS_LOG = {
  REMOVE_FAILED: 'subscribers.remove_failed',
  EXPORT_FAILED: 'subscribers.export_failed',
  SENDING_SAVE_FAILED: 'subscribers.sending_save_failed',
} as const;
