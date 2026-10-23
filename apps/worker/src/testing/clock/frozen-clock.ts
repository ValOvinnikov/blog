export const MOCK_NOW = new Date('2026-10-21T09:00:00.000Z');

export function freezeClock(): void {
  vi.useFakeTimers();
  vi.setSystemTime(MOCK_NOW);
}
