import { HTTP_METHOD, HTTP_STATUS } from '@blog/config';
import { ClientError } from '@sanity/client';
import {
  MOCK_INSUFFICIENT_PERMISSIONS_MESSAGE,
  MOCK_MALFORMED_DOCUMENT_MESSAGE,
  MOCK_SANITY_MUTATE_URL,
  mockSanityGrantError,
} from '@worker/testing/sanity-client-error/fixtures';
import { retryWithBackoff } from '@worker/utils/retry-with-backoff/retry-with-backoff';
import type { Mock } from 'vitest';

import { grantPropagationRetryOptions } from './grant-propagation-retry';

describe(grantPropagationRetryOptions, () => {
  let sleep: Mock<(ms: number) => Promise<void>>;

  beforeEach(() => {
    sleep = vi.fn().mockResolvedValue(undefined);
  });

  it('retries an "insufficient permissions" message failure until it gives up, a bounded and stable number of times', async () => {
    const failure = new Error(MOCK_INSUFFICIENT_PERMISSIONS_MESSAGE);
    const firstRun = vi.fn().mockRejectedValue(failure);

    await expect(
      retryWithBackoff(firstRun, grantPropagationRetryOptions(sleep)),
    ).rejects.toThrow(failure);

    const attemptCount = firstRun.mock.calls.length;
    expect(attemptCount).toBeGreaterThan(1);
    expect(attemptCount).toBeLessThanOrEqual(10);

    const secondRun = vi.fn().mockRejectedValue(failure);
    await expect(
      retryWithBackoff(secondRun, grantPropagationRetryOptions(sleep)),
    ).rejects.toThrow(failure);

    expect(secondRun).toHaveBeenCalledTimes(attemptCount);
  });

  it('retries a structured ClientError carrying the 403 status code until it succeeds', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(mockSanityGrantError())
      .mockResolvedValueOnce('ok');

    const result = await retryWithBackoff(
      fn,
      grantPropagationRetryOptions(sleep),
    );

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledTimes(1);
  });

  it.each([
    [
      'a structured ClientError with an unrelated status code and message',
      new ClientError({
        statusCode: HTTP_STATUS.BAD_REQUEST,
        headers: {},
        body: { message: 'Malformed mutation' },
        url: MOCK_SANITY_MUTATE_URL,
        method: HTTP_METHOD.POST,
      }),
    ],
    [
      'an error whose message is unrelated to grant propagation',
      new Error(MOCK_MALFORMED_DOCUMENT_MESSAGE),
    ],
  ])('does not retry %s', async (_label, otherError) => {
    const fn = vi.fn().mockRejectedValue(otherError);

    await expect(
      retryWithBackoff(fn, grantPropagationRetryOptions(sleep)),
    ).rejects.toThrow(otherError);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });
});
