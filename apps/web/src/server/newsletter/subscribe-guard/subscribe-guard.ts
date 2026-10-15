import type { TMaybeUndefined } from '@blog/config';
import { resolveClientKey } from '@web/server/rate-limit/client-key/client-key';
import { createRateLimiter } from '@web/server/rate-limit/rate-limiter/rate-limiter';
import { logger } from '@web/utils/logger/logger';
import { checkBotId } from 'botid/server';
import { headers } from 'next/headers';

const SUBSCRIBE_ATTEMPTS_PER_WINDOW = 5;
const SUBSCRIBE_WINDOW_MS = 10 * 60_000;
// Past this the store counts as down, and sign-up fails closed rather than hang the form.
const RATE_LIMIT_STORE_TIMEOUT_MS = 2_000;

type TRateLimiter = ReturnType<typeof createRateLimiter>;

// Built on first use: a missing store config then refuses sign-ups instead of failing the module load.
let subscribeRateLimiter: TMaybeUndefined<TRateLimiter>;

const getSubscribeRateLimiter = (): TRateLimiter => {
  subscribeRateLimiter ??= createRateLimiter({
    name: 'newsletter-subscribe',
    windowMs: SUBSCRIBE_WINDOW_MS,
    maxRequests: SUBSCRIBE_ATTEMPTS_PER_WINDOW,
  });
  return subscribeRateLimiter;
};

const withTimeout = async <T>(promise: Promise<T>, ms: number): Promise<T> => {
  let timer: TMaybeUndefined<ReturnType<typeof setTimeout>>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
};

const isRateLimited = async (tenantId: string): Promise<boolean> => {
  try {
    const clientKey = resolveClientKey(await headers());
    return await withTimeout(
      getSubscribeRateLimiter().isLimited({ tenantKey: tenantId, clientKey }),
      RATE_LIMIT_STORE_TIMEOUT_MS,
    );
  } catch (error) {
    logger.warn('newsletter.subscribe_blocked', {
      reason: 'rate_limit_store_unavailable',
      error,
    });
    return true;
  }
};

export const isSubscribeAttemptRefused = async (
  tenantId: string,
): Promise<boolean> => {
  const { isBot } = await checkBotId();
  if (isBot) {
    logger.warn('newsletter.subscribe_blocked', { reason: 'bot' });
    return true;
  }

  return isRateLimited(tenantId);
};
