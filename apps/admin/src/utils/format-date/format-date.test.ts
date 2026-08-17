import { formatDate } from './format-date';

describe(formatDate, () => {
  it('formats a date as a short, human-readable string', () => {
    expect(formatDate(new Date('2026-04-02T00:00:00.000Z'))).toBe(
      'Apr 2, 2026',
    );
  });
});
