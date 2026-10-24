import { MOCK_RATE_LIMIT_START_MS } from '@platform/testing/rate-limit/fixtures';

import { createInMemoryRateLimitStore } from './in-memory-rate-limit-store';

const KEY = 'create-site:ip:2026-10-21:203.0.113.5';
const WINDOW_MS = 60_000;

describe('createInMemoryRateLimitStore', () => {
  it('counts each hit on a key within its window', async () => {
    const { increment } = createInMemoryRateLimitStore();

    await increment(KEY, WINDOW_MS, MOCK_RATE_LIMIT_START_MS);

    expect(await increment(KEY, WINDOW_MS, MOCK_RATE_LIMIT_START_MS + 1)).toBe(
      2,
    );
  });

  it('counts keys separately', async () => {
    const { increment } = createInMemoryRateLimitStore();

    await increment(KEY, WINDOW_MS, MOCK_RATE_LIMIT_START_MS);

    expect(
      await increment(`${KEY}:other`, WINDOW_MS, MOCK_RATE_LIMIT_START_MS),
    ).toBe(1);
  });

  it('starts again once the window has passed', async () => {
    const { increment } = createInMemoryRateLimitStore();

    await increment(KEY, WINDOW_MS, MOCK_RATE_LIMIT_START_MS);

    expect(
      await increment(KEY, WINDOW_MS, MOCK_RATE_LIMIT_START_MS + WINDOW_MS),
    ).toBe(1);
  });
});
