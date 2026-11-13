import { DAY_MS } from '@blog/db/constants';

export function daysBefore(date: Date, days: number): Date {
  return new Date(date.getTime() - days * DAY_MS);
}

export function daysAfter(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

export function utcDayStart(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}
