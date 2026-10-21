import { HTTP_STATUS } from '@blog/config';
import { ClientError } from '@sanity/client';
import type { TRetryWithBackoffOptions } from '@worker/utils/retry-with-backoff/retry-with-backoff';

// Bounded to ride out a freshly-minted token's grant-propagation delay, not to mask a genuine misconfiguration.
const GRANT_PROPAGATION_RETRY_MAX_ATTEMPTS = 5;
const GRANT_PROPAGATION_RETRY_BASE_DELAY_MS = 1000;

function isGrantPropagationError(error: unknown): boolean {
  if (
    error instanceof ClientError &&
    error.statusCode === HTTP_STATUS.FORBIDDEN
  ) {
    return true;
  }

  return (
    error instanceof Error && /insufficient permissions/i.test(error.message)
  );
}

export function grantPropagationRetryOptions(
  sleep: (ms: number) => Promise<void>,
): TRetryWithBackoffOptions {
  return {
    maxAttempts: GRANT_PROPAGATION_RETRY_MAX_ATTEMPTS,
    baseDelayMs: GRANT_PROPAGATION_RETRY_BASE_DELAY_MS,
    isRetryable: isGrantPropagationError,
    sleep,
  };
}
