import type { TMaybeUndefined } from '@shinefold/config/types';
import { TENANT_STATUS } from '@shinefold/db/constants';
import { isNotDeprovisioned } from '@shinefold/db/queries/tenants/not-deprovisioned';
import { tenants } from '@shinefold/db/schema/tenants';
import { and, eq, isNull, lte, type SQL } from 'drizzle-orm';

export function hasEndedUnpaidTrial(now: Date): TMaybeUndefined<SQL> {
  return and(
    eq(tenants.status, TENANT_STATUS.TRIAL),
    lte(tenants.trialEndsAt, now),
    isNull(tenants.stripeSubscriptionId),
    isNotDeprovisioned,
  );
}
