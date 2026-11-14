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
// Web resolves the post's paths in every live language before it answers.
export const SCHEDULED_POST_PURGE_TIMEOUT_MS = 30_000;
