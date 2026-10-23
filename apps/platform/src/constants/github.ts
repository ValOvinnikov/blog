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
