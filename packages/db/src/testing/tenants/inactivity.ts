import { DAY_MS } from '@blog/db/constants';

export const MOCK_LAST_ACTIVITY_AT = new Date('2026-04-07T00:00:00.000Z');

export const MOCK_NO_HOLD = {
  statusBeforeHold: null,
  inactivityWarnedAt: null,
  suspendedAt: null,
  deletionNotifiedAt: null,
  suspensionReason: null,
};

export function daysAfterLastActivity(days: number): Date {
  return new Date(MOCK_LAST_ACTIVITY_AT.getTime() + days * DAY_MS);
}
