const DATE_TIME_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'UTC',
};

/** Shared date-and-time formatter (e.g. "Aug 12, 2026, 2:18 PM") for a stored ISO-8601 timestamp — `undefined` for a value that fails to parse, never a rendered "Invalid Date". */
export const formatDateTime = (isoDate: string): string | undefined => {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toLocaleString('en-US', DATE_TIME_FORMAT_OPTIONS);
};
