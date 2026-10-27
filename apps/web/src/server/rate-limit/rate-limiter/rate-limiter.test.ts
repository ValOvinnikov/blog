import { faker } from '@faker-js/faker';
import { setMockEnv } from '@web/testing/server/infra/set-mock-env';

import { createRateLimiter } from './rate-limiter';

faker.seed(6010);

const { redisCounts, redisConstructor } = vi.hoisted(() => ({
  redisCounts: new Map<string, number>(),
  redisConstructor: vi.fn(),
}));

vi.mock('@web/utils/env/env', () => ({ env: {} }));
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

const MOCK_REDIS_ENV = {
  KV_REST_API_URL: faker.internet.url(),
  KV_REST_API_TOKEN: faker.string.alphanumeric(24),
};
const MOCK_CLIENT = {
  tenantKey: faker.internet.domainName(),
  clientKey: faker.internet.ipv4(),
};
const MOCK_OTHER_TENANT_KEY = faker.internet.domainName();
const MOCK_OTHER_CLIENT_KEY = faker.internet.ipv4();
const MOCK_WINDOW_MS = faker.number.int({ min: 30_000, max: 120_000 });
const MOCK_LIMITER_NAME = faker.lorem.word();
const MOCK_STRICT_LIMITER_NAME = `${MOCK_LIMITER_NAME}-strict`;
const MOCK_LOOSE_LIMITER_NAME = `${MOCK_LIMITER_NAME}-loose`;
const MOCK_LOOSE_MAX_REQUESTS = faker.number.int({ min: 5, max: 9 });
const MOCK_MAX_REQUESTS = faker.number.int({ min: 2, max: 4 });

const hitTimes = async (
  isLimited: (key: typeof MOCK_CLIENT) => Promise<boolean>,
  times: number,
  key = MOCK_CLIENT,
): Promise<boolean[]> => {
  const results: boolean[] = [];
  for (let i = 0; i < times; i += 1) {
    results.push(await isLimited(key));
  }
  return results;
};

describe(createRateLimiter, () => {
  beforeEach(() => {
    vi.useFakeTimers();
    redisCounts.clear();
    redisConstructor.mockReset();
    setMockEnv({});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('without Redis configured', () => {
    it('allows the maximum within a window and refuses the next request', async () => {
      const { isLimited } = createRateLimiter({
        name: MOCK_LIMITER_NAME,
        windowMs: MOCK_WINDOW_MS,
        maxRequests: MOCK_MAX_REQUESTS,
      });

      const results = await hitTimes(isLimited, MOCK_MAX_REQUESTS + 1);

      expect(results).toEqual([
        ...Array.from({ length: MOCK_MAX_REQUESTS }, () => false),
        true,
      ]);
      expect(redisConstructor).not.toHaveBeenCalled();
    });

    it('allows the client again once the window elapses', async () => {
      const { isLimited } = createRateLimiter({
        name: MOCK_LIMITER_NAME,
        windowMs: MOCK_WINDOW_MS,
        maxRequests: 1,
      });
      await hitTimes(isLimited, 2);

      vi.advanceTimersByTime(MOCK_WINDOW_MS + 1);

      expect(await isLimited(MOCK_CLIENT)).toBe(false);
    });

    it.each([
      ['client', { ...MOCK_CLIENT, clientKey: MOCK_OTHER_CLIENT_KEY }],
      ['tenant', { ...MOCK_CLIENT, tenantKey: MOCK_OTHER_TENANT_KEY }],
    ])('counts each %s separately', async (_label, otherKey) => {
      const { isLimited } = createRateLimiter({
        name: MOCK_LIMITER_NAME,
        windowMs: MOCK_WINDOW_MS,
        maxRequests: 1,
      });
      await hitTimes(isLimited, 2);

      expect(await isLimited(otherKey)).toBe(false);
    });

    it('keeps separate counts for limiters with different numbers', async () => {
      const strict = createRateLimiter({
        name: MOCK_STRICT_LIMITER_NAME,
        windowMs: MOCK_WINDOW_MS,
        maxRequests: 1,
      });
      const loose = createRateLimiter({
        name: MOCK_LOOSE_LIMITER_NAME,
        windowMs: MOCK_WINDOW_MS,
        maxRequests: MOCK_LOOSE_MAX_REQUESTS,
      });
      await hitTimes(strict.isLimited, 2);

      const looseResults = await hitTimes(
        loose.isLimited,
        MOCK_LOOSE_MAX_REQUESTS,
      );

      expect(looseResults).not.toContain(true);
      expect(await strict.isLimited(MOCK_CLIENT)).toBe(true);
    });
  });

  describe('with Redis configured', () => {
    beforeEach(() => {
      setMockEnv(MOCK_REDIS_ENV);
    });

    it('shares one allowance between instances of the app', async () => {
      const options = {
        name: MOCK_LIMITER_NAME,
        windowMs: MOCK_WINDOW_MS,
        maxRequests: MOCK_MAX_REQUESTS,
      };
      const firstInstance = createRateLimiter(options);
      const secondInstance = createRateLimiter(options);

      await hitTimes(firstInstance.isLimited, MOCK_MAX_REQUESTS);

      expect(await secondInstance.isLimited(MOCK_CLIENT)).toBe(true);
      expect(redisConstructor).toHaveBeenCalledWith({
        url: MOCK_REDIS_ENV.KV_REST_API_URL,
        token: MOCK_REDIS_ENV.KV_REST_API_TOKEN,
      });
    });
  });

  it('refuses to create a limiter in production without Redis', () => {
    setMockEnv({ VERCEL_ENV: 'production' });

    expect(() =>
      createRateLimiter({
        name: MOCK_LIMITER_NAME,
        windowMs: MOCK_WINDOW_MS,
        maxRequests: 1,
      }),
    ).toThrow(/KV_REST_API_URL/);
  });

  it('falls back to in-memory counts on a preview deployment', async () => {
    setMockEnv({ VERCEL_ENV: 'preview' });
    const { isLimited } = createRateLimiter({
      name: MOCK_LIMITER_NAME,
      windowMs: MOCK_WINDOW_MS,
      maxRequests: 1,
    });

    expect(await hitTimes(isLimited, 2)).toEqual([false, true]);
  });
});
