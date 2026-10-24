import { LOCALE_ISO_CODES } from '@blog/config';

import { formatShortDateTime } from './format-short-date-time';

const NOW = new Date('2026-10-24T15:00:00.000Z');
const YESTERDAY = 'Yesterday';
const EARLIER_THIS_YEAR = '2026-10-19T12:00:00.000Z';

const format = (iso: string) =>
  formatShortDateTime({
    date: new Date(iso),
    now: NOW,
    locale: LOCALE_ISO_CODES.EN,
    yesterdayLabel: YESTERDAY,
  });

describe(formatShortDateTime, () => {
  it('shows only the time for a moment earlier today', () => {
    expect(format('2026-10-24T09:05:00.000Z')).toBe('9:05 AM');
  });

  it('shows the yesterday label for a moment yesterday', () => {
    expect(format('2026-10-23T23:59:00.000Z')).toBe(YESTERDAY);
  });

  it('shows the day and month for an earlier day this year', () => {
    expect(format(EARLIER_THIS_YEAR)).toBe('Oct 19');
  });

  it('adds the year for a day in an earlier year', () => {
    expect(format('2025-12-31T12:00:00.000Z')).toBe('Dec 31, 2025');
  });

  it("follows the locale's own date order", () => {
    expect(
      formatShortDateTime({
        date: new Date(EARLIER_THIS_YEAR),
        now: NOW,
        locale: LOCALE_ISO_CODES.DE,
        yesterdayLabel: YESTERDAY,
      }),
    ).toBe('19. Okt.');
  });
});
