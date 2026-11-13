import { DAY_MS, DOWNGRADE_GRACE_DAYS } from '@blog/db/constants';

export function graceEndDate(graceStartedAt: Date): Date {
  return new Date(graceStartedAt.getTime() + DOWNGRADE_GRACE_DAYS * DAY_MS);
}
