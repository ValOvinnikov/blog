import { ClientError } from '@sanity/client';

import { grantPropagationRetryOptions } from './grant-propagation-retry';
import { retryWithBackoff } from './retry-with-backoff';

function forbiddenClientError(): ClientError {
  return new ClientError({
    statusCode: 403,
    headers: {},
    body: { message: 'Forbidden' },
    url: 'https://api.sanity.io/v2024-01-01/data/mutate/test-dataset',
    method: 'POST',
  });
}

describe(grantPropagationRetryOptions, () => {
  it('retries an "insufficient permissions" message failure until it gives up, a bounded and stable number of times', async () => {
    const sleep = vi.fn().mockResolvedValue(undefined);
    const failure = new Error(
      'transaction failed: Insufficient permissions; permission "create" required',
    );
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
    const sleep = vi.fn().mockResolvedValue(undefined);
    const fn = vi
      .fn()
      .mockRejectedValueOnce(forbiddenClientError())
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
        statusCode: 400,
        headers: {},
        body: { message: 'Malformed mutation' },
        url: 'https://api.sanity.io/v2024-01-01/data/mutate/test-dataset',
        method: 'POST',
      }),
    ],
    [
      'an error whose message is unrelated to grant propagation',
      new Error('malformed document'),
    ],
  ])('does not retry %s', async (_label, otherError) => {
    const sleep = vi.fn().mockResolvedValue(undefined);
    const fn = vi.fn().mockRejectedValue(otherError);

    await expect(
      retryWithBackoff(fn, grantPropagationRetryOptions(sleep)),
    ).rejects.toThrow(otherError);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });
});
