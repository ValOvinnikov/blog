import { isSameLocalDay } from './local-day';

const MOCK_MORNING = new Date(2026, 10, 19, 8, 0);

describe(isSameLocalDay, () => {
  it('matches two times on the same calendar day', () => {
    expect(isSameLocalDay(MOCK_MORNING, new Date(2026, 10, 19, 23, 59))).toBe(
      true,
    );
  });

  it('tells the next calendar day apart', () => {
    expect(isSameLocalDay(MOCK_MORNING, new Date(2026, 10, 20, 0, 0))).toBe(
      false,
    );
  });
});
