import { graceEndDate } from './grace-end-date';

describe(graceEndDate, () => {
  it('ends the grace at midnight UTC fourteen whole days after the day it started', () => {
    expect(graceEndDate(new Date('2026-11-01T22:15:00.000Z'))).toEqual(
      new Date('2026-11-15T00:00:00.000Z'),
    );
  });
});
