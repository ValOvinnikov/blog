import type { TMaybeUndefined } from '@blog/config';
import { resolveClientKey } from '@web/server/rate-limit/client-key/client-key';
import { createRateLimiter } from '@web/server/rate-limit/rate-limiter/rate-limiter';
import { logger } from '@web/utils/logger/logger';
import { checkBotId } from 'botid/server';
import { headers } from 'next/headers';

const RATE_LIMIT_STORE_TIMEOUT_MS = 2_000;

type TRateLimiter = ReturnType<typeof createRateLimiter>;

interface IPublicWriteGuardOptions {
  name: string;
  blockedEvent: string;
  windowMs: number;
  maxRequests: number;
}

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

/** Both checks fail closed: an unreachable BotID or rate-limit store refuses the write. */
export const createPublicWriteGuard = ({
  name,
  blockedEvent,
  windowMs,
  maxRequests,
}: IPublicWriteGuardOptions) => {
  let rateLimiter: TMaybeUndefined<TRateLimiter>;

  const getRateLimiter = (): TRateLimiter => {
    rateLimiter ??= createRateLimiter({ name, windowMs, maxRequests });
    return rateLimiter;
  };

  const isRateLimited = async (tenantId: string): Promise<boolean> => {
    try {
      const clientKey = resolveClientKey(await headers());
      return await withTimeout(
        getRateLimiter().isLimited({ tenantKey: tenantId, clientKey }),
        RATE_LIMIT_STORE_TIMEOUT_MS,
      );
    } catch (error) {
      logger.warn(blockedEvent, {
        reason: 'rate_limit_store_unavailable',
        error,
      });
      return true;
    }
  };

  const isBotOrUnverified = async (): Promise<boolean> => {
    try {
      const { isBot } = await checkBotId();
      if (isBot) {
        logger.warn(blockedEvent, { reason: 'bot' });
      }
      return isBot;
    } catch (error) {
      logger.warn(blockedEvent, { reason: 'bot_check_unavailable', error });
      return true;
    }
  };

  return { isBotOrUnverified, isRateLimited };
};
