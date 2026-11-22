export const DAY_MONTH_LONG_UTC = {
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
} as const satisfies Intl.DateTimeFormatOptions;

export const DAY_MONTH_SHORT_UTC = {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
} as const satisfies Intl.DateTimeFormatOptions;

export const DAY_MONTH_YEAR_SHORT_UTC = {
  ...DAY_MONTH_SHORT_UTC,
  year: 'numeric',
} as const satisfies Intl.DateTimeFormatOptions;
