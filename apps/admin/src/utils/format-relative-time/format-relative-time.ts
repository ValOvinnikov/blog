const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
};

/**
 * Short relative time for recent events ("2h ago"), falling back to an
 * absolute short date (e.g. "Aug 12") once an event is more than a week
 * old — a relative label past that point stops being useful at a glance.
 */
export const formatRelativeTime = (
  date: Date,
  now: Date = new Date(),
): string => {
  const diffMs = now.getTime() - date.getTime();

  if (diffMs < MINUTE_MS) {
    return 'Just now';
  }
  if (diffMs < HOUR_MS) {
    return `${Math.floor(diffMs / MINUTE_MS)}m ago`;
  }
  if (diffMs < DAY_MS) {
    return `${Math.floor(diffMs / HOUR_MS)}h ago`;
  }
  if (diffMs < 7 * DAY_MS) {
    return `${Math.floor(diffMs / DAY_MS)}d ago`;
  }

  return date.toLocaleDateString('en-US', DATE_FORMAT_OPTIONS);
};
