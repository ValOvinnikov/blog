import type { Mock } from 'vitest';

import { retryWithBackoff } from './retry-with-backoff';

describe(retryWithBackoff, () => {
  let sleep: Mock<(ms: number) => Promise<void>>;

  beforeEach(() => {
    sleep = vi.fn().mockResolvedValue(undefined);
  });

  it('returns the result on the first successful attempt without sleeping', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const result = await retryWithBackoff(fn, {
      maxAttempts: 3,
      baseDelayMs: 10,
      isRetryable: () => true,
      sleep,
    });

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it('retries a retryable failure with doubling backoff until it succeeds', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('nope'))
      .mockRejectedValueOnce(new Error('nope'))
      .mockResolvedValueOnce('ok');
    const result = await retryWithBackoff(fn, {
      maxAttempts: 5,
      baseDelayMs: 10,
      isRetryable: () => true,
      sleep,
    });

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenNthCalledWith(1, 10);
    expect(sleep).toHaveBeenNthCalledWith(2, 20);
  });

  it('rethrows once maxAttempts is exhausted', async () => {
    const failure = new Error('always fails');
    const fn = vi.fn().mockRejectedValue(failure);
    await expect(
      retryWithBackoff(fn, {
        maxAttempts: 3,
        baseDelayMs: 10,
        isRetryable: () => true,
        sleep,
      }),
    ).rejects.toThrow(failure);

    expect(fn).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledTimes(2);
  });

  it('rethrows immediately when the error is not retryable', async () => {
    const failure = new Error('not our error');
    const fn = vi.fn().mockRejectedValue(failure);
    const isRetryable = vi.fn().mockReturnValue(false);

    await expect(
      retryWithBackoff(fn, {
        maxAttempts: 5,
        baseDelayMs: 10,
        isRetryable,
        sleep,
      }),
    ).rejects.toThrow(failure);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
    expect(isRetryable).toHaveBeenCalledWith(failure);
  });
});
