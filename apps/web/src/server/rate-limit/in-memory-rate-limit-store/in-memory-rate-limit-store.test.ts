import { createInMemoryRateLimitStore } from './in-memory-rate-limit-store';

describe(createInMemoryRateLimitStore, () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('forgets the oldest key once the tracked-key cap is reached', async () => {
    const { increment } = createInMemoryRateLimitStore();
    await increment('client-0', 60_000);
    await increment('client-0', 60_000);

    let forgotten = false;
    for (let i = 1; i < 10_000 && !forgotten; i += 1) {
      await increment(`client-${i}`, 60_000);
      forgotten = (await increment('client-0', 60_000)) === 1;
    }

    expect(forgotten).toBe(true);
  });
});
