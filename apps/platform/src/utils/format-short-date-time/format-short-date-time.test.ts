import { LOCALE_ISO_CODES, type TLocaleIsoCode } from '@blog/config';
import { faker } from '@faker-js/faker';

import { formatShortDateTime } from './format-short-date-time';

faker.seed(6006);

const MOCK_NOW = new Date('2026-10-24T15:00:00.000Z');
const MOCK_YESTERDAY_LABEL = faker.lorem.word();
const MOCK_EARLIER_THIS_YEAR = '2026-10-19T12:00:00.000Z';

describe(formatShortDateTime, () => {
  it.each<[string, TLocaleIsoCode, string, string]>([
    [
      'only the time earlier today',
      LOCALE_ISO_CODES.EN,
      '2026-10-24T09:05:00.000Z',
      '9:05 AM',
    ],
    [
      'the yesterday label for yesterday',
      LOCALE_ISO_CODES.EN,
      '2026-10-23T23:59:00.000Z',
      MOCK_YESTERDAY_LABEL,
    ],
    [
      'the day and month earlier this year',
      LOCALE_ISO_CODES.EN,
      MOCK_EARLIER_THIS_YEAR,
      'Oct 19',
    ],
    [
      'the year too for an earlier year',
      LOCALE_ISO_CODES.EN,
      '2025-12-31T12:00:00.000Z',
      'Dec 31, 2025',
    ],
    [
      "the date in the locale's own order",
      LOCALE_ISO_CODES.DE,
      MOCK_EARLIER_THIS_YEAR,
      '19. Okt.',
    ],
  ])('shows %s', (_label, locale, isoDate, expected) => {
    const formatted = formatShortDateTime({
      date: new Date(isoDate),
      now: MOCK_NOW,
      locale,
      yesterdayLabel: MOCK_YESTERDAY_LABEL,
    });

    expect(formatted).toBe(expected);
  });
});
