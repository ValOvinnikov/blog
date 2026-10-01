import { LOCALE_BCP47_TAGS, type TLocaleIsoCode } from '@blog/config';

const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
};

export const formatDate = (date: Date, locale: TLocaleIsoCode): string => {
  return date.toLocaleDateString(
    LOCALE_BCP47_TAGS[locale],
    DATE_FORMAT_OPTIONS,
  );
};
