import { utcDay, utcDayDaysBefore, utcMonthStartDay } from './utc-day';

const LATE_EVENING = new Date('2026-03-01T23:30:00-05:00');

describe(utcDay, () => {
  it('names the UTC calendar day', () => {
    expect(utcDay(LATE_EVENING)).toBe('2026-03-02');
  });
});

describe(utcDayDaysBefore, () => {
  it('steps back across a month boundary', () => {
    expect(utcDayDaysBefore(LATE_EVENING, 2)).toBe('2026-02-28');
  });
});

describe(utcMonthStartDay, () => {
  it('names the first day of the UTC month', () => {
    expect(utcMonthStartDay(LATE_EVENING)).toBe('2026-03-01');
  });
});
