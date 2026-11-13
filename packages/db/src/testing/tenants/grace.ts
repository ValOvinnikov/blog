import { MOCK_NOW } from '@blog/db/testing/frozen-clock';
import { daysBefore } from '@blog/db/utils/day-offset/day-offset';

export function daysBeforeNow(days: number): Date {
  return daysBefore(MOCK_NOW, days);
}
