import { faker } from '@faker-js/faker';
import { MOCK_RATE_LIMIT_START_MS } from '@platform/testing/rate-limit/fixtures';

import { createInMemoryRateLimitStore } from './in-memory-rate-limit-store';

faker.seed(5998);

const MOCK_KEY = faker.lorem.slug();
const MOCK_OTHER_KEY = faker.lorem.slug();
const WINDOW_MS = 60_000;

describe(createInMemoryRateLimitStore, () => {
  let increment: ReturnType<typeof createInMemoryRateLimitStore>['increment'];

  beforeEach(async () => {
    ({ increment } = createInMemoryRateLimitStore());
    await increment(MOCK_KEY, WINDOW_MS, MOCK_RATE_LIMIT_START_MS);
  });

  it('counts each hit on a key within its window', async () => {
    const count = await increment(
      MOCK_KEY,
      WINDOW_MS,
      MOCK_RATE_LIMIT_START_MS + 1,
    );

    expect(count).toBe(2);
  });

  it('counts keys separately', async () => {
    const count = await increment(
      MOCK_OTHER_KEY,
      WINDOW_MS,
      MOCK_RATE_LIMIT_START_MS,
    );

    expect(count).toBe(1);
  });

  it('starts again once the window has passed', async () => {
    const count = await increment(
      MOCK_KEY,
      WINDOW_MS,
      MOCK_RATE_LIMIT_START_MS + WINDOW_MS,
    );

    expect(count).toBe(1);
  });
});
