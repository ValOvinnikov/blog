import { errorResult, okResult, type TResult } from '@blog/utils';
import type { TGitHubFailureReason } from '@platform/server/github/fetch-github';
import { logger } from '@platform/utils/logger/logger';

export type TReleaseCandidateFailureReason =
  | Exclude<TGitHubFailureReason, 'notFound'>
  | 'noReleaseTag'
  | 'tagListIncomplete'
  | 'dbError';

export type TReleaseResult<T> = TResult<T, TReleaseCandidateFailureReason>;

export const toReleaseFailure = (
  reason: TGitHubFailureReason | 'tagListIncomplete',
): TReleaseResult<never> =>
  errorResult(reason === 'notFound' ? 'githubError' : reason);

export const readDb = async <T>(
  read: () => Promise<T>,
): Promise<TReleaseResult<T>> => {
  try {
    return okResult(await read());
  } catch (error) {
    logger.error('releases.db_read_failed', { error });
    return errorResult('dbError');
  }
};
