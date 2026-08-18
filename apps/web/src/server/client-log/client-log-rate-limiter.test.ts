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
});
