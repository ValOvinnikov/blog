export const MOCK_ONE_HOUR_MS = 60 * 60_000;
export const MOCK_NOW = new Date('2026-10-21T09:00:00.000Z');

export function freezeClock(): void {
  vi.useFakeTimers();
  vi.setSystemTime(MOCK_NOW);
}
