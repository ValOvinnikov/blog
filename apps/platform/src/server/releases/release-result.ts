import type { TValueOf } from '@blog/config/utils';
import { errorResult, okResult, type TResult } from '@blog/utils';
import {
  GITHUB_FAILURE,
  type TGitHubFailure,
} from '@platform/constants/github';
import { RELEASE_FAILURE, RELEASE_LOG } from '@platform/constants/release';
import { logger } from '@platform/utils/logger/logger';

export type TReleaseCandidateFailureReason =
  | Exclude<TGitHubFailure, typeof GITHUB_FAILURE.NOT_FOUND>
  | TValueOf<typeof RELEASE_FAILURE>;

export type TReleaseResult<T> = TResult<T, TReleaseCandidateFailureReason>;

export const toReleaseFailure = (
  reason: TGitHubFailure | typeof RELEASE_FAILURE.TAG_LIST_INCOMPLETE,
): TReleaseResult<never> =>
  errorResult(
    reason === GITHUB_FAILURE.NOT_FOUND ? GITHUB_FAILURE.GITHUB_ERROR : reason,
  );

export const readDb = async <T>(
  read: () => Promise<T>,
): Promise<TReleaseResult<T>> => {
  try {
    return okResult(await read());
  } catch (error) {
    logger.error(RELEASE_LOG.DB_READ_FAILED, { error });
    return errorResult(RELEASE_FAILURE.DB_ERROR);
  }
};
