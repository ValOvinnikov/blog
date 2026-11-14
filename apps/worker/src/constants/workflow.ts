import { DAY_MS } from '@blog/db/constants';

export const WORKFLOW_RUN_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
} as const;

// A run waiting on a post's publish time re-reads it at least daily, so a re-dated or unpublished post is noticed.
export const SCHEDULED_POST_RECHECK_MS = DAY_MS;
