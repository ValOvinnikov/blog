import { LOCALE_BCP47_TAGS, type TLocaleIsoCode } from '@blog/config';

const DAY_MS = 86_400_000;
const TIME_ZONE = 'UTC';

const utcDayNumber = (date: Date) => Math.floor(date.getTime() / DAY_MS);

export type TFormatShortDateTimeInput = {
  date: Date;
  now: Date;
  locale: TLocaleIsoCode;
  yesterdayLabel: string;
};

/** Days are UTC days, as `formatDateTime` is UTC, so the server and the browser render the same text. */
export const formatShortDateTime = ({
  date,
  now,
  locale,
  yesterdayLabel,
}: TFormatShortDateTimeInput): string => {
  const daysAgo = utcDayNumber(now) - utcDayNumber(date);
  const tag = LOCALE_BCP47_TAGS[locale];

  if (daysAgo <= 0) {
    return date.toLocaleTimeString(tag, {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: TIME_ZONE,
    });
  }
  if (daysAgo === 1) return yesterdayLabel;

  return date.toLocaleDateString(tag, {
    day: 'numeric',
    month: 'short',
    year:
      date.getUTCFullYear() === now.getUTCFullYear() ? undefined : 'numeric',
    timeZone: TIME_ZONE,
  });
};
