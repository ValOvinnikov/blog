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

/**
 * Short relative time for recent events ("2h ago"), falling back to an
 * absolute short date (e.g. "Aug 12") once an event is more than a week
 * old — a relative label past that point stops being useful at a glance.
 * The relative labels route through `t`; the absolute-date fallback keeps
 * its own fixed `en-US` formatting (a separate, narrower concern).
 */
export const formatRelativeTime = (
  date: Date,
  t: TRelativeTimeTranslator,
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

  return date.toLocaleDateString('en-US', DATE_FORMAT_OPTIONS);
};
