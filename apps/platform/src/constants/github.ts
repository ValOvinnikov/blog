import { ACTION_OUTCOME, TENANT_DELETE_OUTCOME } from '@blog/config/constants';
import type { TValueOf } from '@blog/config/utils';
import { DOMAIN_AVAILABILITY } from '@platform/constants/domain';

export const GITHUB_FAILURE = {
  NOT_CONFIGURED: DOMAIN_AVAILABILITY.NOT_CONFIGURED,
  RATE_LIMITED: ACTION_OUTCOME.RATE_LIMITED,
  NOT_FOUND: TENANT_DELETE_OUTCOME.NOT_FOUND,
  GITHUB_ERROR: 'GITHUB_ERROR',
} as const;

export type TGitHubFailure = TValueOf<typeof GITHUB_FAILURE>;

export const GITHUB_RATE_LIMIT_REMAINING_HEADER = 'x-ratelimit-remaining';

export const GITHUB_RATE_LIMIT_EXHAUSTED = String(0);

export const GITHUB_FILE_STATUS = {
  ADDED: 'added',
  MODIFIED: 'modified',
} as const;

export const GITHUB_RUN_STATUS = {
  QUEUED: 'queued',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const;

export const GITHUB_RUN_CONCLUSION = {
  SUCCESS: 'success',
  FAILURE: 'failure',
  SKIPPED: 'skipped',
} as const;

export const GITHUB_LOG = {
  NOT_CONFIGURED: 'github.not_configured',
  RATE_LIMITED: 'github.rate_limited',
  REQUEST_ERROR: 'github.request_error',
  REQUEST_FAILED: 'github.request_failed',
  TAG_LIST_INCOMPLETE: 'github.tag_list_incomplete',
  UNEXPECTED_RESPONSE: 'github.unexpected_response',
} as const;
