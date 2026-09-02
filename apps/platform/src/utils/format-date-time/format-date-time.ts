const DATE_TIME_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'UTC',
  timeZoneName: 'short',
};

/** Shared date-and-time formatter (e.g. "Aug 12, 2026, 2:18 PM UTC") for a stored ISO-8601 timestamp, always in UTC to match GitHub Actions logs — `undefined` for an unparseable value, never a rendered "Invalid Date". */
export const formatDateTime = (isoDate: string): string | undefined => {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toLocaleString('en-US', DATE_TIME_FORMAT_OPTIONS);
};
