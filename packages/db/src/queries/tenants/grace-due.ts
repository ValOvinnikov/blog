import type { TMaybeUndefined } from '@blog/config/types';
import {
  DAY_MS,
  DOWNGRADE_GRACE_DAYS,
  GRACE_EMAIL,
  GRACE_EMAIL_DAY,
  GRACE_EMAIL_DUE_UNTIL_DAY,
  type TGraceEmail,
} from '@blog/db/constants';
import { tenants } from '@blog/db/schema/tenants';
import { and, gt, isNull, lte, type SQL } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';

export const GRACE_EMAIL_STAMP = {
  [GRACE_EMAIL.STARTED]: 'graceStartedEmailSentAt',
  [GRACE_EMAIL.HALFWAY]: 'graceHalfwayEmailSentAt',
  [GRACE_EMAIL.ENDING]: 'graceEndingEmailSentAt',
} as const satisfies Record<TGraceEmail, keyof typeof tenants.$inferSelect>;

function daysBefore(now: Date, days: number): Date {
  return new Date(now.getTime() - days * DAY_MS);
}

export function graceEmailDue(
  email: TGraceEmail,
  now: Date,
): TMaybeUndefined<SQL> {
  const stamp: AnyPgColumn = tenants[GRACE_EMAIL_STAMP[email]];

  return and(
    isNull(tenants.deprovisionedAt),
    lte(
      tenants.downgradeGraceStartedAt,
      daysBefore(now, GRACE_EMAIL_DAY[email]),
    ),
    gt(
      tenants.downgradeGraceStartedAt,
      daysBefore(now, GRACE_EMAIL_DUE_UNTIL_DAY[email]),
    ),
    isNull(stamp),
  );
}

export function graceEndDue(now: Date): TMaybeUndefined<SQL> {
  return and(
    isNull(tenants.deprovisionedAt),
    lte(tenants.downgradeGraceStartedAt, daysBefore(now, DOWNGRADE_GRACE_DAYS)),
  );
}
