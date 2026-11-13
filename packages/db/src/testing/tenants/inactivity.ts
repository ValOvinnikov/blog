import { daysAfter } from '@blog/db/utils/day-offset/day-offset';

export const MOCK_LAST_ACTIVITY_AT = new Date('2026-04-07T00:00:00.000Z');

export const MOCK_NO_HOLD = {
  statusBeforeHold: null,
  inactivityWarnedAt: null,
  suspendedAt: null,
  deletionNotifiedAt: null,
  suspensionReason: null,
};

export function daysAfterLastActivity(days: number): Date {
  return daysAfter(MOCK_LAST_ACTIVITY_AT, days);
}
