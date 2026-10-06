import { LOCALE_BCP47_TAGS, type TLocaleIsoCode } from '@blog/config';

const DATE_TIME_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'UTC',
  timeZoneName: 'short',
};

/** Always in UTC to match GitHub Actions logs — `undefined` for an unparseable value, never a rendered "Invalid Date". */
export const formatDateTime = (
  isoDate: string,
  locale: TLocaleIsoCode,
): string | undefined => {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toLocaleString(
    LOCALE_BCP47_TAGS[locale],
    DATE_TIME_FORMAT_OPTIONS,
  );
};
