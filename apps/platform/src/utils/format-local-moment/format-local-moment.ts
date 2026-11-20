import { LOCALE_BCP47_TAGS, type TLocaleIsoCode } from '@shinefold/config';
import { isSameLocalDay } from '@shinefold/utils/date';

export type TLocalMoment = { isToday: boolean; text: string };

export const formatLocalMoment = (
  date: Date,
  now: Date,
  locale: TLocaleIsoCode,
): TLocalMoment => {
  const tag = LOCALE_BCP47_TAGS[locale];
  const isToday = isSameLocalDay(date, now);
  const text = isToday
    ? date.toLocaleTimeString(tag, { hour: 'numeric', minute: '2-digit' })
    : date.toLocaleString(tag, { dateStyle: 'medium', timeStyle: 'short' });
  return { isToday, text };
};
