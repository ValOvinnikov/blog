import { faker } from '@faker-js/faker';

import { createInMemoryRateLimitStore } from './in-memory-rate-limit-store';

faker.seed(6010);

const MOCK_WINDOW_MS = faker.number.int({ min: 30_000, max: 120_000 });
const MOCK_CLIENT_PREFIX = faker.string.alphanumeric(8);
const OVER_CAP_CLIENT_COUNT = 10_000;

describe(createInMemoryRateLimitStore, () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('forgets the oldest key once the tracked-key cap is reached', async () => {
    const { increment } = createInMemoryRateLimitStore();
    const oldestKey = `${MOCK_CLIENT_PREFIX}-0`;
    await increment(oldestKey, MOCK_WINDOW_MS);
    await increment(oldestKey, MOCK_WINDOW_MS);

    let forgotten = false;
    for (let i = 1; i < OVER_CAP_CLIENT_COUNT && !forgotten; i += 1) {
      await increment(`${MOCK_CLIENT_PREFIX}-${i}`, MOCK_WINDOW_MS);
      forgotten = (await increment(oldestKey, MOCK_WINDOW_MS)) === 1;
    }

    expect(forgotten).toBe(true);
  });
});
