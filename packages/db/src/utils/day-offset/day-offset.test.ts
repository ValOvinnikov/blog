import { daysAfter, daysBefore, utcDayStart } from './day-offset';

const MOCK_MOMENT = new Date('2026-10-21T23:59:58.000Z');

describe(daysBefore, () => {
  it('moves a date back by whole days', () => {
    expect(daysBefore(MOCK_MOMENT, 3)).toEqual(
      new Date('2026-10-18T23:59:58.000Z'),
    );
  });
});

describe(daysAfter, () => {
  it('moves a date forward by whole days', () => {
    expect(daysAfter(MOCK_MOMENT, 14)).toEqual(
      new Date('2026-11-04T23:59:58.000Z'),
    );
  });
});

describe(utcDayStart, () => {
  it('returns midnight UTC of the same day', () => {
    expect(utcDayStart(MOCK_MOMENT)).toEqual(
      new Date('2026-10-21T00:00:00.000Z'),
    );
  });
});
