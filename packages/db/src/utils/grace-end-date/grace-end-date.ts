import { DOWNGRADE_GRACE_DAYS } from '@shinefold/db/constants';
import {
  daysAfter,
  utcDayStart,
} from '@shinefold/db/utils/day-offset/day-offset';

export function graceEndDate(graceStartedAt: Date): Date {
  return daysAfter(utcDayStart(graceStartedAt), DOWNGRADE_GRACE_DAYS);
}
