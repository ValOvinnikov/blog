export const MOCK_NOW = new Date('2026-10-21T09:00:00.000Z');

export function useFrozenClock(now: Date = MOCK_NOW): void {
  beforeEach(() => {
    vi.useFakeTimers({ now, toFake: ['Date'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });
}
