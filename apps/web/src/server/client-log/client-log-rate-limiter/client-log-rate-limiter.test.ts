export {};

const freshModule = async () => {
  vi.resetModules();
  return import('./client-log-rate-limiter');
};

const FLOOD_CEILING = 100;

const floodUntilLimited = (
  isClientLogRateLimited: (clientKey: string) => boolean,
  clientKey: string,
): boolean[] => {
  const results: boolean[] = [];
  for (let i = 0; i < FLOOD_CEILING && !results.at(-1); i++) {
    results.push(isClientLogRateLimited(clientKey));
  }
  if (!results.at(-1)) {
    throw new Error(
      `floodUntilLimited did not hit the rate limit within ${FLOOD_CEILING} requests`,
    );
  }
  return results;
};

describe('isClientLogRateLimited', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('rejects a request once the per-window limit is exceeded, allowing every one before it', async () => {
    const { isClientLogRateLimited } = await freshModule();

    const results = floodUntilLimited(isClientLogRateLimited, 'client-a');

    expect(results.at(-1)).toBe(true);
    expect(results.slice(0, -1)).not.toContain(true);
  });

  it('tracks each client key independently', async () => {
    const { isClientLogRateLimited } = await freshModule();
    floodUntilLimited(isClientLogRateLimited, 'client-a');

    expect(isClientLogRateLimited('client-b')).toBe(false);
  });

  it('resets the count once the window elapses', async () => {
    const { isClientLogRateLimited } = await freshModule();
    const results = floodUntilLimited(isClientLogRateLimited, 'client-a');
    expect(results.at(-1)).toBe(true);

    vi.advanceTimersByTime(60_001);

    expect(isClientLogRateLimited('client-a')).toBe(false);
  });

  it('evicts the oldest tracked client once the tracked-client cap is reached, forgetting its rate-limit history', async () => {
    const { isClientLogRateLimited } = await freshModule();
    const floodResults = floodUntilLimited(isClientLogRateLimited, 'client-0');
    expect(floodResults.at(-1)).toBe(true);

    let forgotten = false;
    for (let i = 1; i < 10_000 && !forgotten; i += 1) {
      isClientLogRateLimited(`client-${i}`);
      forgotten = !isClientLogRateLimited('client-0');
    }

    expect(forgotten).toBe(true);
  });
});
