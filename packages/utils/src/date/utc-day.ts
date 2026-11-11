const ISO_DATE_LENGTH = 10;

export function utcDay(at: Date): string {
  return at.toISOString().slice(0, ISO_DATE_LENGTH);
}

export function utcDayDaysBefore(at: Date, days: number): string {
  return utcDay(
    new Date(
      Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate() - days),
    ),
  );
}

export function utcMonthStartDay(at: Date): string {
  return utcDay(new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), 1)));
}
