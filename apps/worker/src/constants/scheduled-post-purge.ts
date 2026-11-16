import { HTTP_STATUS } from '@shinefold/config/constants';

export const SCHEDULED_POST_PURGE_LOG = {
  START_FAILED: 'scheduled_post_purge.start_failed',
  RUN_FAILED: 'scheduled_post_purge.run_failed',
} as const;

export const SCHEDULED_POST_STATE = {
  DUE: 'DUE',
  SCHEDULED: 'SCHEDULED',
  STALE: 'STALE',
} as const;

export const SCHEDULED_POST_PURGE_HOOK_PREFIX = 'scheduled-post-purge:';
export const WEB_SCHEDULED_POST_PURGE_PATH = '/api/revalidate/scheduled-post';
// Covers web's enqueue hop for a post dated only seconds ahead.
export const SCHEDULED_POST_PURGE_GRACE_MS = 60_000;
// Web resolves the post's paths in every live language before it answers.
export const SCHEDULED_POST_PURGE_TIMEOUT_MS = 30_000;
export const SCHEDULED_POST_PURGE_RETRYABLE_STATUSES: readonly number[] = [
  HTTP_STATUS.REQUEST_TIMEOUT,
  HTTP_STATUS.TOO_EARLY,
  HTTP_STATUS.TOO_MANY_REQUESTS,
];
