import 'server-only';

import { Redis } from '@upstash/redis';

interface IRedisRateLimitStoreConfig {
  url: string;
  token: string;
}

export const createRedisRateLimitStore = ({
  url,
  token,
}: IRedisRateLimitStoreConfig) => {
  const redis = new Redis({ url, token });

  const increment = async (key: string, windowMs: number): Promise<number> => {
    const [count] = await redis
      .pipeline()
      .incr(key)
      .pexpire(key, windowMs, 'NX')
      .exec<[number, 0 | 1]>();
    return count;
  };

  return { increment };
};
