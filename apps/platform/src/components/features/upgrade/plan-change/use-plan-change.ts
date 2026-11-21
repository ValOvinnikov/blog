'use client';

import type { TPlanChoice } from '@platform/constants/plan-change';
import { changePlanAction } from '@platform/server/billing/change-plan-action';
import { getTenantPlanAction } from '@platform/server/billing/get-tenant-plan-action';
import { usePaidChange } from '@platform/utils/use-paid-change/use-paid-change';
import type { TMaybeUndefined } from '@shinefold/config';
import type { TTenantPlan } from '@shinefold/config/constants';

export const usePlanChange = (
  tenantId: string,
  currentPlan: TTenantPlan,
  publishableKey: TMaybeUndefined<string>,
) => {
  const { submit, ...change } = usePaidChange({
    tenantId,
    current: currentPlan,
    poll: getTenantPlanAction,
    publishableKey,
  });

  return {
    ...change,
    submit: (choice: TPlanChoice) =>
      submit(() => changePlanAction(tenantId, choice), choice.plan),
  };
};
