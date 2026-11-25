import type {
  TGitHubCacheKey,
  TGitHubFailure,
} from '@platform/constants/github';
import { errorResult, okResult } from '@shinefold/utils';
import { unstable_cache } from 'next/cache';

import type { TGitHubResult } from './fetch-github';

class GitHubFailureError extends Error {
  constructor(readonly failure: TGitHubFailure) {
    super(failure);
  }
}

type TCacheGitHubResultOptions = {
  key: TGitHubCacheKey;
  version: number;
};

/** A failure is never stored; it is returned with its failure code on every call. */
export const cacheGitHubResult = <TArgs extends string[], T>(
  read: (...args: TArgs) => Promise<TGitHubResult<T>>,
  { key, version }: TCacheGitHubResultOptions,
) => {
  const readOrThrow = async (...args: TArgs): Promise<T> => {
    const result = await read(...args);
    if (!result.ok) throw new GitHubFailureError(result.error);
    return result.data;
  };
  const cached = unstable_cache(readOrThrow, [key, String(version)], {
    revalidate: false,
  });

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
