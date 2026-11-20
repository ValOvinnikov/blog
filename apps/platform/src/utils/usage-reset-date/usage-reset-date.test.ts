import { usageResetDate } from './usage-reset-date';

const NEXT_DECEMBER_START = new Date('2026-12-01T00:00:00.000Z');

describe(usageResetDate.name, () => {
  it('is the first day of the next UTC month', () => {
    expect(usageResetDate(new Date('2026-11-20T15:30:00.000Z'))).toEqual(
      NEXT_DECEMBER_START,
    );
  });

  it('rolls over into the next year from December', () => {
    expect(usageResetDate(new Date('2026-12-31T23:59:59.000Z'))).toEqual(
      new Date('2027-01-01T00:00:00.000Z'),
    );
  });

  it('keeps to the UTC month late on its last day', () => {
    expect(usageResetDate(new Date('2026-11-30T23:30:00.000Z'))).toEqual(
      NEXT_DECEMBER_START,
    );
  });
});
