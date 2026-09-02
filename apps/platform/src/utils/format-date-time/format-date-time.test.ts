import { formatDateTime } from './format-date-time';

describe(formatDateTime, () => {
  it('formats an ISO timestamp as a short, human-readable date and time', () => {
    expect(formatDateTime('2026-08-12T14:18:00.000Z')).toBe(
      'Aug 12, 2026, 2:18 PM',
    );
  });

  it('returns undefined for an unparseable value instead of rendering "Invalid Date"', () => {
    expect(formatDateTime('not-a-date')).toBeUndefined();
  });
});
