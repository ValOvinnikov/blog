import type { TMaybeUndefined } from '@blog/config/types';
import { TENANT_STATUS } from '@blog/db/constants';
import { tenants } from '@blog/db/schema/tenants';
import { and, eq, isNull, lte, type SQL } from 'drizzle-orm';

export function hasEndedUnpaidTrial(now: Date): TMaybeUndefined<SQL> {
  return and(
    eq(tenants.status, TENANT_STATUS.TRIAL),
    lte(tenants.trialEndsAt, now),
    isNull(tenants.stripeSubscriptionId),
    isNull(tenants.deprovisionedAt),
  );
}
