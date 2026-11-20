import { usageResetDate } from './usage-reset-date';

const MOCK_MID_NOVEMBER = new Date('2026-11-20T15:30:00.000Z');
const MOCK_LATE_NOVEMBER = new Date('2026-11-30T23:30:00.000Z');
const MOCK_LATE_DECEMBER = new Date('2026-12-31T23:59:59.000Z');
const MOCK_DECEMBER_START = new Date('2026-12-01T00:00:00.000Z');
const MOCK_JANUARY_START = new Date('2027-01-01T00:00:00.000Z');

describe(usageResetDate.name, () => {
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
    expect(usageResetDate(now)).toEqual(resetDate);
  });
});
