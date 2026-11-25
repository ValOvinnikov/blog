import type { TGitHubFailure } from '@platform/constants/github';
import { errorResult, okResult } from '@shinefold/utils';
import { unstable_cache } from 'next/cache';

import type { TGitHubResult } from './fetch-github';

class GitHubFailureError extends Error {
  constructor(readonly failure: TGitHubFailure) {
    super(failure);
  }
}

/** Stores a successful result without expiry, keyed by its arguments; a failure is never stored. */
export const cacheGitHubResult = <TArgs extends string[], T>(
  read: (...args: TArgs) => Promise<TGitHubResult<T>>,
  keyParts: string[],
) => {
  const readOrThrow = async (...args: TArgs): Promise<T> => {
    const result = await read(...args);
    if (!result.ok) throw new GitHubFailureError(result.error);
    return result.data;
  };
  const cached = unstable_cache(readOrThrow, keyParts, { revalidate: false });

  return async (...args: TArgs): Promise<TGitHubResult<T>> => {
    try {
      return okResult(await cached(...args));
    } catch (error) {
      if (error instanceof GitHubFailureError)
        return errorResult(error.failure);
      throw error;
    }
  };
};
