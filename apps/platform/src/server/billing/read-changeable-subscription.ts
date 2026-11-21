import 'server-only';

import { PLAN_CHANGE_REFUSAL } from '@platform/constants/plan-change';
import type { TTenantMembershipContext } from '@platform/server/auth/require-tenant-membership';
import { ACTION_OUTCOME } from '@shinefold/config';
import { errorResult, okResult, type TResult } from '@shinefold/utils';
import { toOutcome } from '@shinefold/utils/to-outcome';

import {
  refusedPlanChange,
  type TChangePlanResult,
} from './plan-change-outcome';
import {
  readTenantSubscriptionPlan,
  type TTenantSubscriptionPlan,
} from './read-tenant-subscription-plan';
import { planChangeRefusalFor } from './upgrade-state-for';

export const readChangeableSubscription = async ({
  tenant,
  viewer,
}: Pick<TTenantMembershipContext, 'tenant' | 'viewer'>): Promise<
  TResult<TTenantSubscriptionPlan, TChangePlanResult>
> => {
  const gate = planChangeRefusalFor(tenant, viewer);
  if (gate) return errorResult(refusedPlanChange(gate));

  const { id, stripeSubscriptionId } = tenant;
  const read =
    stripeSubscriptionId &&
    (await readTenantSubscriptionPlan(id, stripeSubscriptionId));
  if (!read) return errorResult(toOutcome(ACTION_OUTCOME.SERVER_ERROR));
  if (!read.subscription.isChangeable) {
    return errorResult(refusedPlanChange(PLAN_CHANGE_REFUSAL.NOT_ACTIVE));
  }
  return okResult(read);
};
