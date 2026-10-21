export const TEST_NOW = new Date('2026-10-21T09:00:00.000Z');

export function freezeClock(): void {
  vi.useFakeTimers();
  vi.setSystemTime(TEST_NOW);
}
