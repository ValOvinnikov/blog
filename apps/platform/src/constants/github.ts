import type { TValueOf } from '@blog/config/utils';

export const GITHUB_FAILURE = {
  NOT_CONFIGURED: 'NOT_CONFIGURED',
  RATE_LIMITED: 'RATE_LIMITED',
  NOT_FOUND: 'NOT_FOUND',
  GITHUB_ERROR: 'GITHUB_ERROR',
} as const;

export type TGitHubFailure = TValueOf<typeof GITHUB_FAILURE>;

export const GITHUB_RATE_LIMIT_REMAINING_HEADER = 'x-ratelimit-remaining';

export const GITHUB_RATE_LIMIT_EXHAUSTED = '0';
