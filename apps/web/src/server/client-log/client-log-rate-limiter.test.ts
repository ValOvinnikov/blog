export {};

const freshModule = async () => {
  vi.resetModules();
  return import('./client-log-rate-limiter');
};

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

    for (let i = 0; i < 5; i += 1) {
      isClientLogRateLimited(`client-${i}`);
    }
    expect(getTrackedClientCountForTests()).toBe(5);

    vi.advanceTimersByTime(60_001);

    isClientLogRateLimited('client-new');
    expect(getTrackedClientCountForTests()).toBe(1);
  });

  it('evicts the oldest tracked client once the tracked-client cap is reached, forgetting its rate-limit history', async () => {
    const {
      isClientLogRateLimited,
      MAX_TRACKED_CLIENTS,
      MAX_REQUESTS_PER_WINDOW,
    } = await freshModule();

    for (let i = 0; i < MAX_REQUESTS_PER_WINDOW + 5; i += 1) {
      isClientLogRateLimited('client-0');
    }
    expect(isClientLogRateLimited('client-0')).toBe(true);

    for (let i = 1; i < MAX_TRACKED_CLIENTS; i += 1) {
      isClientLogRateLimited(`client-${i}`);
    }
    isClientLogRateLimited('client-overflow');

    expect(isClientLogRateLimited('client-0')).toBe(false);
  });
});
