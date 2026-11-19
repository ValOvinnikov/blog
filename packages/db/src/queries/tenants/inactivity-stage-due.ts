import { SELLABLE_TENANT_PLANS } from '@shinefold/config/constants';
import type { TMaybeUndefined } from '@shinefold/config/types';
import {
  INACTIVITY_STAGE,
  INACTIVITY_STAGE_DAY,
  WRITABLE_TENANT_STATUSES,
  SUSPENSION_REASON,
  TENANT_STATUS,
  type TInactivityStage,
} from '@shinefold/db/constants';
import { isNotDeprovisioned } from '@shinefold/db/queries/tenants/not-deprovisioned';
import { tenants } from '@shinefold/db/schema/tenants';
import { daysBefore } from '@shinefold/db/utils/day-offset/day-offset';
import {
  and,
  eq,
  inArray,
  isNotNull,
  isNull,
  lte,
  notInArray,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';

const isWritable = inArray(tenants.status, WRITABLE_TENANT_STATUSES);

const hasNoLiveSubscription = or(
  isNull(tenants.stripeSubscriptionId),
  notInArray(tenants.plan, [...SELLABLE_TENANT_PLANS]),
);

const isSuspendedForInactivity = and(
  eq(tenants.status, TENANT_STATUS.SUSPENDED),
  eq(tenants.suspensionReason, SUSPENSION_REASON.INACTIVITY),
);

// The deprovisioning run is that stage's stamp: one started after the
// deletion notice means the stage has already been claimed.
const hasNoDeprovisioningRunSinceNotice = sql`coalesce(
  (${tenants.deprovisioningSteps}->'run'->>'startedAt')::timestamptz at time zone 'UTC' < ${tenants.deletionNotifiedAt},
  true
)`;

const stageCondition: Record<TInactivityStage, TMaybeUndefined<SQL>> = {
  [INACTIVITY_STAGE.SUSPENSION_WARNING]: and(
    isWritable,
    isNull(tenants.inactivityWarnedAt),
  ),
  [INACTIVITY_STAGE.SUSPENSION]: and(
    isWritable,
    isNotNull(tenants.inactivityWarnedAt),
  ),
  [INACTIVITY_STAGE.DELETION_NOTICE]: and(
    isSuspendedForInactivity,
    isNull(tenants.deletionNotifiedAt),
  ),
  [INACTIVITY_STAGE.DEPROVISIONING]: and(
    isSuspendedForInactivity,
    isNotNull(tenants.deletionNotifiedAt),
    hasNoDeprovisioningRunSinceNotice,
  ),
};

export function inactivityStageDue(
  stage: TInactivityStage,
  now: Date,
): TMaybeUndefined<SQL> {
  const cutoff = daysBefore(now, INACTIVITY_STAGE_DAY[stage]);

  return and(
    isNotDeprovisioned,
    hasNoLiveSubscription,
    lte(tenants.lastActivityAt, cutoff),
    stageCondition[stage],
  );
}
