// The Studio's copy is British English, so dates read "22 Nov 2026" and times use the 24-hour clock.
const STUDIO_DATE_LOCALE = 'en-GB';

export const formatSendCount = (count: number): string =>
  count.toLocaleString(STUDIO_DATE_LOCALE);

export const formatSubscribers = (count: number): string =>
  `${formatSendCount(count)} ${count === 1 ? 'subscriber' : 'subscribers'}`;

const DAY_FORMAT = {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
} as const satisfies Intl.DateTimeFormatOptions;

export const formatSendDay = (iso: string): string =>
  new Date(iso).toLocaleDateString(STUDIO_DATE_LOCALE, DAY_FORMAT);

// The month's emails reset at midnight UTC on the 1st, which is still the last day of the month west of UTC.
export const formatSendUtcDay = (iso: string): string =>
  new Date(iso).toLocaleDateString(STUDIO_DATE_LOCALE, {
    ...DAY_FORMAT,
    timeZone: 'UTC',
  });

export const formatSendTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString(STUDIO_DATE_LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
  });
