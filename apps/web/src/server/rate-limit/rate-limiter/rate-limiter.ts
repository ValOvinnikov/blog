import { createInMemoryRateLimitStore } from '@web/server/rate-limit/in-memory-rate-limit-store/in-memory-rate-limit-store';
import { createRedisRateLimitStore } from '@web/server/rate-limit/redis-rate-limit-store/redis-rate-limit-store';
import { env } from '@web/utils/env/env';

interface IRateLimiterOptions {
  name: string;
  windowMs: number;
  maxRequests: number;
}

interface IRateLimitKey {
  tenantKey: string;
  clientKey: string;
}

const createStore = () => {
  const { KV_REST_API_URL: url, KV_REST_API_TOKEN: token, VERCEL_ENV } = env;
  if (url && token) {
    return createRedisRateLimitStore({ url, token });
  }
  if (VERCEL_ENV === 'production') {
    throw new Error(
      'Rate limiting requires KV_REST_API_URL and KV_REST_API_TOKEN in production.',
    );
  }
  return createInMemoryRateLimitStore();
};

export const createRateLimiter = ({
  name,
  windowMs,
  maxRequests,
}: IRateLimiterOptions) => {
  const store = createStore();

  const isLimited = async ({
    tenantKey,
    clientKey,
  }: IRateLimitKey): Promise<boolean> => {
    const count = await store.increment(
      `rate-limit:${name}:${tenantKey}:${clientKey}`,
      windowMs,
    );
    return count > maxRequests;
  };

  return { isLimited };
};
