import { LOCALE_ISO_CODES } from '@blog/config';

import { formatDate } from './format-date';

const MOCK_DATE = new Date('2026-04-02T00:00:00.000Z');

describe(formatDate, () => {
  it.each([
    [LOCALE_ISO_CODES.EN, 'Apr 2, 2026'],
    [LOCALE_ISO_CODES.NL, '2 apr 2026'],
    [LOCALE_ISO_CODES.FR, '2 avr. 2026'],
    [LOCALE_ISO_CODES.DE, '2. Apr. 2026'],
    [LOCALE_ISO_CODES.ES, '2 abr 2026'],
  ])('formats a short date in %s', (locale, expected) => {
    expect(formatDate(MOCK_DATE, locale)).toBe(expected);
  });
});
