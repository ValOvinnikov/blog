const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
};

/** Shared short-date formatter (e.g. "Apr 2, 2026") for admin list/detail views. */
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', DATE_FORMAT_OPTIONS);
};
