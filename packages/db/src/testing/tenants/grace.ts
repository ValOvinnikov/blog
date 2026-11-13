import { DAY_MS } from '@blog/db/constants';
import { MOCK_NOW } from '@blog/db/testing/frozen-clock';

export function graceStartedDaysAgo(days: number): Date {
  return new Date(MOCK_NOW.getTime() - days * DAY_MS);
}
