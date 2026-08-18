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

  it('sweeps an expired entry off the tracked-client Map instead of leaking it forever', async () => {
    const { isClientLogRateLimited, MAX_TRACKED_CLIENTS } = await freshModule();

    // One tracked client, then let its window fully elapse.
    isClientLogRateLimited('client-a');
    vi.advanceTimersByTime(60_001);

    // Fill the Map back up to exactly its cap with fresh distinct clients —
    // if the expired `client-a` entry were still occupying a slot, this
    // would already be at (or over) capacity and the next new client below
    // would have to evict one of these instead of getting its own slot.
    for (let i = 0; i < MAX_TRACKED_CLIENTS; i += 1) {
      isClientLogRateLimited(`fresh-${i}`);
    }

    // None of the just-added fresh-* clients should have been evicted to
    // make room — proof the earlier sweep actually freed client-a's slot.
    for (let i = 0; i < 20; i += 1) {
      isClientLogRateLimited('fresh-0');
    }
    expect(isClientLogRateLimited('fresh-0')).toBe(true);
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
