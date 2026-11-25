import { faker } from '@faker-js/faker';
import { GITHUB_CACHE_KEY, GITHUB_FAILURE } from '@platform/constants/github';
import { clearMemoryUnstableCache } from '@platform/testing/memory-unstable-cache';
import { errorResult, okResult } from '@shinefold/utils';

import { cacheGitHubResult } from './cache-github-result';
import type { TGitHubResult } from './fetch-github';

faker.seed(8072);

vi.mock('next/cache', async () => {
  const { memoryUnstableCache } =
    await import('@platform/testing/memory-unstable-cache');

  return { unstable_cache: memoryUnstableCache };
});

describe(cacheGitHubResult, () => {
  const read = vi.fn<(id: string) => Promise<TGitHubResult<string>>>();
  let cached: ReturnType<typeof cacheGitHubResult<[string], string>>;
  let id: string;
  let data: string;
  let version: number;

  beforeEach(() => {
    clearMemoryUnstableCache();
    version = faker.number.int();
    cached = cacheGitHubResult(read, {
      key: GITHUB_CACHE_KEY.COMPARISON,
      version,
    });
    id = faker.string.uuid();
    data = faker.lorem.sentence();
  });

  describe('when the read succeeds', () => {
    beforeEach(() => {
      read.mockResolvedValue(okResult(data));
    });

    it('serves the result from the store on the next call', async () => {
      const first = await cached(id);
      const second = await cached(id);

      expect(first).toEqual(okResult(data));
      expect(second).toEqual(okResult(data));
      expect(read).toHaveBeenCalledTimes(1);
    });

    it('reads again for a different argument', async () => {
      await cached(id);
      await cached(faker.string.uuid());

      expect(read).toHaveBeenCalledTimes(2);
    });

    it('reads again under a different version', async () => {
      const nextVersion = cacheGitHubResult(read, {
        key: GITHUB_CACHE_KEY.COMPARISON,
        version: version + 1,
      });

      await cached(id);
      await nextVersion(id);

      expect(read).toHaveBeenCalledTimes(2);
    });
  });

  it('returns the failure unchanged and retries it on the next call', async () => {
    read
      .mockResolvedValueOnce(errorResult(GITHUB_FAILURE.RATE_LIMITED))
      .mockResolvedValueOnce(okResult(data));

    const failed = await cached(id);
    const retried = await cached(id);

    expect(failed).toEqual(errorResult(GITHUB_FAILURE.RATE_LIMITED));
    expect(retried).toEqual(okResult(data));
    expect(read).toHaveBeenCalledTimes(2);
  });

  it('propagates an error that is not a GitHub failure', async () => {
    const failure = new Error(faker.lorem.sentence());
    read.mockRejectedValueOnce(failure);

    await expect(cached(id)).rejects.toBe(failure);
  });
});
