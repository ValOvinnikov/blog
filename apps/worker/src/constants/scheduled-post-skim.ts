export const SCHEDULED_POST_SKIM_LOG = {
  START_FAILED: 'scheduled_post_skim.start_failed',
  RUN_FAILED: 'scheduled_post_skim.run_failed',
} as const;

export const SCHEDULED_POST_SKIM_HOOK_PREFIX = 'scheduled-post-skim:';
export const WEB_SCHEDULED_POST_SKIM_PATH = '/api/generate-skim/scheduled';
// Web reads the post and waits on Claude before it answers.
export const SCHEDULED_POST_SKIM_TIMEOUT_MS = 90_000;
