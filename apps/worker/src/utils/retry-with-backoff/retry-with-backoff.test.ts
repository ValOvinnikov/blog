import { faker } from '@faker-js/faker';
import type { Mock } from 'vitest';

import {
  retryWithBackoff,
  type TRetryWithBackoffOptions,
} from './retry-with-backoff';

faker.seed(7016);

const MOCK_RESULT = faker.lorem.word();
const MOCK_FAILURE = faker.lorem.sentence();
const MOCK_BASE_DELAY_MS = 10;

describe(retryWithBackoff, () => {
  let sleep: Mock<(ms: number) => Promise<void>>;

  function retry(
    fn: () => Promise<string>,
    overrides: Partial<TRetryWithBackoffOptions> = {},
  ) {
    return retryWithBackoff(fn, {
      maxAttempts: 3,
      baseDelayMs: MOCK_BASE_DELAY_MS,
      isRetryable: () => true,
      sleep,
      ...overrides,
    });
  }

  beforeEach(() => {
    sleep = vi.fn().mockResolvedValue(undefined);
  });

  it('returns the result on the first successful attempt without sleeping', async () => {
    const fn = vi.fn().mockResolvedValue(MOCK_RESULT);

    const result = await retry(fn);

    expect(result).toBe(MOCK_RESULT);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it('retries a retryable failure with doubling backoff until it succeeds', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error(MOCK_FAILURE))
      .mockRejectedValueOnce(new Error(MOCK_FAILURE))
      .mockResolvedValueOnce(MOCK_RESULT);

    const result = await retry(fn, { maxAttempts: 5 });

    expect(result).toBe(MOCK_RESULT);
    expect(fn).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenNthCalledWith(1, MOCK_BASE_DELAY_MS);
    expect(sleep).toHaveBeenNthCalledWith(2, MOCK_BASE_DELAY_MS * 2);
  });

  it('rethrows once maxAttempts is exhausted', async () => {
    const failure = new Error(MOCK_FAILURE);
    const fn = vi.fn().mockRejectedValue(failure);

    await expect(retry(fn)).rejects.toThrow(failure);

    expect(fn).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledTimes(2);
  });

  it('rethrows immediately when the error is not retryable', async () => {
    const failure = new Error(MOCK_FAILURE);
    const fn = vi.fn().mockRejectedValue(failure);
    const isRetryable = vi.fn().mockReturnValue(false);

    await expect(retry(fn, { maxAttempts: 5, isRetryable })).rejects.toThrow(
      failure,
    );

    expect(fn).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
    expect(isRetryable).toHaveBeenCalledWith(failure);
  });
});
