import {
  utcDay,
  utcDayDaysBefore,
  utcMonthStartDay,
  utcNextMonthStart,
} from './utc-day';

const MOCK_LATE_EVENING = new Date('2026-03-01T23:30:00-05:00');

describe(utcDay, () => {
  it('names the UTC calendar day', () => {
    expect(utcDay(MOCK_LATE_EVENING)).toBe('2026-03-02');
  });
});

describe(utcDayDaysBefore, () => {
  it('steps back across a month boundary', () => {
    expect(utcDayDaysBefore(MOCK_LATE_EVENING, 2)).toBe('2026-02-28');
  });
});

describe(utcMonthStartDay, () => {
  it('names the first day of the UTC month', () => {
    expect(utcMonthStartDay(MOCK_LATE_EVENING)).toBe('2026-03-01');
  });
});

const MOCK_MID_NOVEMBER = new Date('2026-11-20T15:30:00.000Z');
const MOCK_LATE_NOVEMBER = new Date('2026-11-30T23:30:00.000Z');
const MOCK_LATE_DECEMBER = new Date('2026-12-31T23:59:59.000Z');
const MOCK_DECEMBER_START = new Date('2026-12-01T00:00:00.000Z');
const MOCK_JANUARY_START = new Date('2027-01-01T00:00:00.000Z');

describe(utcNextMonthStart, () => {
  it.each([
    [
      'is the first day of the next UTC month',
      MOCK_MID_NOVEMBER,
      MOCK_DECEMBER_START,
    ],
    [
      'keeps to the UTC month late on its last day',
      MOCK_LATE_NOVEMBER,
      MOCK_DECEMBER_START,
    ],
    [
      'rolls over into the next year from December',
      MOCK_LATE_DECEMBER,
      MOCK_JANUARY_START,
    ],
  ])('%s', (_, now, resetDate) => {
    expect(utcNextMonthStart(now)).toEqual(resetDate);
  });
});
