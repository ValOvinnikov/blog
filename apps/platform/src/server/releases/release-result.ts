import type { TGitHubFailureReason } from '@platform/server/github/fetch-github';
import { logger } from '@platform/utils/logger/logger';

export type TReleaseCandidateFailureReason =
  Exclude<TGitHubFailureReason, 'notFound'> | 'noReleaseTag' | 'dbError';

export type TReleaseResult<T> =
  { ok: true; data: T } | { ok: false; reason: TReleaseCandidateFailureReason };

export const toReleaseFailure = (
  reason: TGitHubFailureReason,
): { ok: false; reason: TReleaseCandidateFailureReason } => ({
  ok: false,
  reason: reason === 'notFound' ? 'githubError' : reason,
});

export const readDb = async <T>(
  read: () => Promise<T>,
): Promise<TReleaseResult<T>> => {
  try {
    return { ok: true, data: await read() };
  } catch (error) {
    logger.error('releases.db_read_failed', { error });
    return { ok: false, reason: 'dbError' };
  }
};
