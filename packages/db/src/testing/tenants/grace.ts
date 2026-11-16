import { MOCK_NOW } from '@shinefold/db/testing/frozen-clock';
import { daysBefore } from '@shinefold/db/utils/day-offset/day-offset';

export function daysBeforeNow(days: number): Date {
  return daysBefore(MOCK_NOW, days);
}
