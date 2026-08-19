export {};

async function freshModule() {
  vi.resetModules();
  return import('./client-log-rate-limiter');
}

describe('isClientLogRateLimited', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows requests under the per-window limit', async () => {
    const { isClientLogRateLimited } = await freshModule();

    for (let i = 0; i < 20; i += 1) {
      expect(isClientLogRateLimited('client-a')).toBe(false);
    }
  });

  it('rate-limits a client that floods past the per-window limit', async () => {
    const { isClientLogRateLimited } = await freshModule();

    for (let i = 0; i < 20; i += 1) {
      isClientLogRateLimited('client-a');
    }

    expect(isClientLogRateLimited('client-a')).toBe(true);
  });

  it('tracks each client key independently', async () => {
    const { isClientLogRateLimited } = await freshModule();

    for (let i = 0; i < 20; i += 1) {
      isClientLogRateLimited('client-a');
    }

    expect(isClientLogRateLimited('client-b')).toBe(false);
  });

  it('resets the count once the window elapses', async () => {
    const { isClientLogRateLimited } = await freshModule();

    for (let i = 0; i < 20; i += 1) {
      isClientLogRateLimited('client-a');
    }
    expect(isClientLogRateLimited('client-a')).toBe(true);

    vi.advanceTimersByTime(60_001);

    expect(isClientLogRateLimited('client-a')).toBe(false);
  });

  it('sweeps expired entries off the tracked-client Map on the very next call, independent of the eviction cap', async () => {
    const { isClientLogRateLimited, getTrackedClientCountForTests } =
      await freshModule();

    // Five distinct tracked clients, nowhere near MAX_TRACKED_CLIENTS, so
    // nothing here can trigger FIFO eviction — a size drop can only come
    // from the sweep. (Asserting the boolean `isClientLogRateLimited`
    // return alone can't distinguish "swept" from "evicted": both a working
    // sweep and a stubbed-out no-op sweep would still let a 6th distinct
    // key through as `false`, since eviction only kicks in at the cap.)
    for (let i = 0; i < 5; i += 1) {
      isClientLogRateLimited(`client-${i}`);
    }
    expect(getTrackedClientCountForTests()).toBe(5);

    vi.advanceTimersByTime(60_001);

    // The sweep runs unconditionally at the top of every call, before this
    // one's own key is even looked up — so this single call for a brand
    // new key must both clear all 5 now-expired entries and add exactly
    // one new one. Without the sweep, size would be 6 (5 stale + 1 new);
    // with it, it's 1.
    isClientLogRateLimited('client-new');
    expect(getTrackedClientCountForTests()).toBe(1);
  });

  it('evicts the oldest tracked client once the tracked-client cap is reached, forgetting its rate-limit history', async () => {
    const {
      isClientLogRateLimited,
      MAX_TRACKED_CLIENTS,
      MAX_REQUESTS_PER_WINDOW,
    } = await freshModule();

    // client-0 is the very first tracked key — flood it past its own limit
    // so its rate-limited state would be observable if it were retained.
    for (let i = 0; i < MAX_REQUESTS_PER_WINDOW + 5; i += 1) {
      isClientLogRateLimited('client-0');
    }
    expect(isClientLogRateLimited('client-0')).toBe(true);

    // Fill the tracked-client cap with distinct keys (client-0 already
    // counts as one of them), then push one more past it — that final call
    // must evict client-0, the oldest still-tracked entry.
    for (let i = 1; i < MAX_TRACKED_CLIENTS; i += 1) {
      isClientLogRateLimited(`client-${i}`);
    }
    isClientLogRateLimited('client-overflow');

    // client-0's rate-limit history is gone — it's treated as brand new.
    expect(isClientLogRateLimited('client-0')).toBe(false);
  });
});
