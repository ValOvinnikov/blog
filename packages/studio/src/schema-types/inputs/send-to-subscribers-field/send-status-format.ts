// The Studio's copy is British English, so dates read "22 Nov 2026" and times use the 24-hour clock.
const STUDIO_DATE_LOCALE = 'en-GB';

export const formatSendCount = (count: number): string =>
  count.toLocaleString(STUDIO_DATE_LOCALE);

export const formatSubscribers = (count: number): string =>
  `${formatSendCount(count)} ${count === 1 ? 'subscriber' : 'subscribers'}`;

export const formatSendDay = (iso: string): string =>
  new Date(iso).toLocaleDateString(STUDIO_DATE_LOCALE, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

export const formatSendTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString(STUDIO_DATE_LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
  });
