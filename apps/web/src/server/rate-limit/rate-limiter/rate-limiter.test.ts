import type { createRateLimiter as TCreateRateLimiter } from './rate-limiter';

const { redisCounts, redisConstructor } = vi.hoisted(() => ({
  redisCounts: new Map<string, number>(),
  redisConstructor: vi.fn(),
}));

vi.mock('@upstash/redis', () => ({
  Redis: class {
    constructor(config: unknown) {
      redisConstructor(config);
    }

    pipeline() {
      let key = '';
      const pipeline = {
        incr: (incrKey: string) => {
          key = incrKey;
          return pipeline;
        },
        pexpire: () => pipeline,
        exec: async () => {
          const count = (redisCounts.get(key) ?? 0) + 1;
          redisCounts.set(key, count);
          return [count, 1];
        },
      };
      return pipeline;
    }
  },
}));

const REDIS_ENV = {
  KV_REST_API_URL: 'https://redis.example.com',
  KV_REST_API_TOKEN: 'token',
};

const CLIENT_A = { tenantKey: 'acme.example.com', clientKey: '203.0.113.5' };

const loadFactory = async (
  env: Record<string, string>,
): Promise<typeof TCreateRateLimiter> => {
  vi.doMock('@web/utils/env/env', () => ({ env }));
  vi.resetModules();
  return (await import('./rate-limiter')).createRateLimiter;
};

const hitTimes = async (
  isLimited: (key: typeof CLIENT_A) => Promise<boolean>,
  times: number,
  key = CLIENT_A,
): Promise<boolean[]> => {
  const results: boolean[] = [];
  for (let i = 0; i < times; i += 1) {
    results.push(await isLimited(key));
  }
  return results;
};

describe('createRateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    redisCounts.clear();
    redisConstructor.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('without Redis configured', () => {
    let createRateLimiter: typeof TCreateRateLimiter;

    beforeEach(async () => {
      createRateLimiter = await loadFactory({});
    });

    it('allows the maximum within a window and refuses the next request', async () => {
      const { isLimited } = createRateLimiter({
        name: 'test',
        windowMs: 60_000,
        maxRequests: 3,
      });

      expect(await hitTimes(isLimited, 4)).toEqual([false, false, false, true]);
      expect(redisConstructor).not.toHaveBeenCalled();
    });

    it('allows the client again once the window elapses', async () => {
      const { isLimited } = createRateLimiter({
        name: 'test',
        windowMs: 60_000,
        maxRequests: 1,
      });
      await hitTimes(isLimited, 2);

      vi.advanceTimersByTime(60_001);

      expect(await isLimited(CLIENT_A)).toBe(false);
    });

    it('counts each client and each tenant separately', async () => {
      const { isLimited } = createRateLimiter({
        name: 'test',
        windowMs: 60_000,
        maxRequests: 1,
      });
      await hitTimes(isLimited, 2);

      expect(await isLimited({ ...CLIENT_A, clientKey: '203.0.113.9' })).toBe(
        false,
      );
      expect(await isLimited({ ...CLIENT_A, tenantKey: 'other.example' })).toBe(
        false,
      );
    });

    it('keeps separate counts for limiters with different numbers', async () => {
      const strict = createRateLimiter({
        name: 'strict',
        windowMs: 60_000,
        maxRequests: 1,
      });
      const loose = createRateLimiter({
        name: 'loose',
        windowMs: 60_000,
        maxRequests: 5,
      });
      await hitTimes(strict.isLimited, 2);

      expect(await hitTimes(loose.isLimited, 5)).not.toContain(true);
      expect(await strict.isLimited(CLIENT_A)).toBe(true);
    });
  });

  describe('with Redis configured', () => {
    it('shares one allowance between instances of the app', async () => {
      const options = { name: 'test', windowMs: 60_000, maxRequests: 2 };
      const firstInstance = (await loadFactory(REDIS_ENV))(options);
      const secondInstance = (await loadFactory(REDIS_ENV))(options);

      await hitTimes(firstInstance.isLimited, 2);

      expect(await secondInstance.isLimited(CLIENT_A)).toBe(true);
      expect(redisConstructor).toHaveBeenCalledWith({
        url: 'https://redis.example.com',
        token: 'token',
      });
    });
  });

  it('refuses to create a limiter in production without Redis', async () => {
    const createRateLimiter = await loadFactory({ VERCEL_ENV: 'production' });

    expect(() =>
      createRateLimiter({ name: 'test', windowMs: 60_000, maxRequests: 1 }),
    ).toThrow(/KV_REST_API_URL/);
  });

  it('falls back to in-memory counts on a preview deployment', async () => {
    const createRateLimiter = await loadFactory({ VERCEL_ENV: 'preview' });
    const { isLimited } = createRateLimiter({
      name: 'test',
      windowMs: 60_000,
      maxRequests: 1,
    });

    expect(await hitTimes(isLimited, 2)).toEqual([false, true]);
  });
});
