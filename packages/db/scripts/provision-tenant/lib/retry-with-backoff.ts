export type TRetryWithBackoffOptions = {
  maxAttempts: number;
  baseDelayMs: number;
  isRetryable: (error: unknown) => boolean;
  sleep?: (ms: number) => Promise<void>;
};

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Runs `fn`, retrying with exponential backoff (doubling from `baseDelayMs`)
 * while `isRetryable` accepts the thrown error, up to `maxAttempts` total
 * attempts — the last failure is rethrown once attempts are exhausted.
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: TRetryWithBackoffOptions,
): Promise<T> {
  const {
    maxAttempts,
    baseDelayMs,
    isRetryable,
    sleep = defaultSleep,
  } = options;

  for (let attempt = 1; ; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= maxAttempts || !isRetryable(error)) {
        throw error;
      }
      await sleep(baseDelayMs * 2 ** (attempt - 1));
    }
  }
}
