import { LOCALE_BCP47_TAGS, type TLocaleIsoCode } from '@blog/config';

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
};

/** Structurally compatible with both `useTranslations`'s and `getTranslations`'s return type, without fighting next-intl's per-namespace literal-key generic. */
export type TRelativeTimeTranslator = (
  key: string,
  values?: Record<string, string | number>,
) => string;

/** Falls back to an absolute short date past a week, where a relative label stops being useful at a glance. */
export const formatRelativeTime = (
  date: Date,
  t: TRelativeTimeTranslator,
  locale: TLocaleIsoCode,
  now: Date = new Date(),
): string => {
  const diffMs = now.getTime() - date.getTime();

  if (diffMs < MINUTE_MS) {
    return t('relativeJustNow');
  }
  if (diffMs < HOUR_MS) {
    return t('relativeMinutesAgo', { minutes: Math.floor(diffMs / MINUTE_MS) });
  }
  if (diffMs < DAY_MS) {
    return t('relativeHoursAgo', { hours: Math.floor(diffMs / HOUR_MS) });
  }
  if (diffMs < 7 * DAY_MS) {
    return t('relativeDaysAgo', { days: Math.floor(diffMs / DAY_MS) });
  }

  return date.toLocaleDateString(
    LOCALE_BCP47_TAGS[locale],
    DATE_FORMAT_OPTIONS,
  );
};
