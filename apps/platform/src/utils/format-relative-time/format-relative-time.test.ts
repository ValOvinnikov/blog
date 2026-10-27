import { LOCALE_ISO_CODES } from '@blog/config';
import { makeEnTranslator } from '@platform/testing/en-translator';

import { formatRelativeTime } from './format-relative-time';

const MOCK_NOW = new Date('2026-08-26T12:00:00.000Z');

const t = makeEnTranslator('activityList');

describe(formatRelativeTime, () => {
  it.each([
    {
      name: 'just now for an event less than a minute old',
      date: '2026-08-26T11:59:31.000Z',
      expected: t('relativeJustNow'),
    },
    {
      name: 'minutes for an event under an hour old',
      date: '2026-08-26T11:45:00.000Z',
      expected: t('relativeMinutesAgo', { minutes: 15 }),
    },
    {
      name: 'hours for an event under a day old',
      date: '2026-08-26T10:00:00.000Z',
      expected: t('relativeHoursAgo', { hours: 2 }),
    },
    {
      name: 'days for an event under a week old',
      date: '2026-08-24T12:00:00.000Z',
      expected: t('relativeDaysAgo', { days: 2 }),
    },
  ])('renders $name', ({ date, expected }) => {
    expect(
      formatRelativeTime(new Date(date), t, LOCALE_ISO_CODES.EN, MOCK_NOW),
    ).toBe(expected);
  });

  it.each([
    [LOCALE_ISO_CODES.EN, 'Aug 12'],
    [LOCALE_ISO_CODES.NL, '12 aug'],
    [LOCALE_ISO_CODES.FR, '12 août'],
    [LOCALE_ISO_CODES.DE, '12. Aug.'],
    [LOCALE_ISO_CODES.ES, '12 ago'],
  ])(
    'falls back to an absolute short date in %s past a week',
    (locale, expected) => {
      const date = new Date('2026-08-12T14:22:00.000Z');

      expect(formatRelativeTime(date, t, locale, MOCK_NOW)).toBe(expected);
    },
  );
});
