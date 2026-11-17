import { formatDate } from '@platform/utils/format-date/format-date';
import type { TLocaleIsoCode } from '@shinefold/config';
import type { ReactNode } from 'react';

export const richDate = (date: Date, locale: TLocaleIsoCode) => ({
  date: formatDate(date, locale),
  time: (chunks: ReactNode) => (
    <time dateTime={date.toISOString()}>{chunks}</time>
  ),
});
