import { LOCALE_ISO_CODES } from '@blog/config';

import { formatDateTime } from './format-date-time';

const MOCK_ISO_TIMESTAMP = '2026-08-12T14:18:00.000Z';
const MOCK_UNPARSEABLE_TIMESTAMP = 'not-a-date';

describe(formatDateTime, () => {
  it.each([
    [LOCALE_ISO_CODES.EN, 'Aug 12, 2026, 2:18 PM UTC'],
    [LOCALE_ISO_CODES.NL, '12 aug 2026, 14:18 UTC'],
    [LOCALE_ISO_CODES.FR, '12 août 2026, 14:18 UTC'],
    [LOCALE_ISO_CODES.DE, '12. Aug. 2026, 14:18 UTC'],
    [LOCALE_ISO_CODES.ES, '12 ago 2026, 14:18 UTC'],
  ])(
    'formats an ISO timestamp as a date and time in %s',
    (locale, expected) => {
      expect(formatDateTime(MOCK_ISO_TIMESTAMP, locale)).toBe(expected);
    },
  );

  it('returns undefined for an unparseable value', () => {
    expect(
      formatDateTime(MOCK_UNPARSEABLE_TIMESTAMP, LOCALE_ISO_CODES.EN),
    ).toBeUndefined();
  });
});
