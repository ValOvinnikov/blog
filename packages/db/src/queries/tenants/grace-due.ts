import type { TMaybeUndefined } from '@blog/config/types';
import {
  DOWNGRADE_GRACE_DAYS,
  GRACE_EMAIL,
  GRACE_EMAIL_DAY,
  GRACE_EMAIL_DUE_UNTIL_DAY,
  type TGraceEmail,
} from '@blog/db/constants';
import { tenants } from '@blog/db/schema/tenants';
import { daysBefore, utcDayStart } from '@blog/db/utils/day-offset/day-offset';
import { and, gte, isNull, lt, type SQL } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';

export const GRACE_EMAIL_STAMP = {
  [GRACE_EMAIL.STARTED]: 'graceStartedEmailSentAt',
  [GRACE_EMAIL.HALFWAY]: 'graceHalfwayEmailSentAt',
  [GRACE_EMAIL.ENDING]: 'graceEndingEmailSentAt',
} as const satisfies Record<TGraceEmail, keyof typeof tenants.$inferSelect>;

// Counts whole UTC days, so a sweep's time of day never moves a step to another day.
function startedBeforeSweepDay(now: Date, days: number): Date {
  return daysBefore(utcDayStart(now), days - 1);
}

export function graceEmailDue(
  email: TGraceEmail,
  now: Date,
): TMaybeUndefined<SQL> {
  const stamp: AnyPgColumn = tenants[GRACE_EMAIL_STAMP[email]];

  return and(
    isNull(tenants.deprovisionedAt),
    lt(
      tenants.downgradeGraceStartedAt,
      startedBeforeSweepDay(now, GRACE_EMAIL_DAY[email]),
    ),
    gte(
      tenants.downgradeGraceStartedAt,
      startedBeforeSweepDay(now, GRACE_EMAIL_DUE_UNTIL_DAY[email]),
    ),
    isNull(stamp),
  );
}

export function graceEndDue(now: Date): TMaybeUndefined<SQL> {
  return and(
    isNull(tenants.deprovisionedAt),
    lt(
      tenants.downgradeGraceStartedAt,
      startedBeforeSweepDay(now, DOWNGRADE_GRACE_DAYS),
    ),
  );
}
