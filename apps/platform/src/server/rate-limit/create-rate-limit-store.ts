import 'server-only';

import { createInMemoryRateLimitStore } from '@platform/server/rate-limit/in-memory-rate-limit-store';
import { createRedisRateLimitStore } from '@platform/server/rate-limit/redis-rate-limit-store';
import { env } from '@platform/utils/env/env';

export const createRateLimitStore = () => {
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
