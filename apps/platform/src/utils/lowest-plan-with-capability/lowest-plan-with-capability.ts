import type { TCapability } from '@shinefold/config';
import { TENANT_PLAN, type TTenantPlan } from '@shinefold/config/constants';
import { PLAN_REGISTRY } from '@shinefold/db/constants';

// TENANT_PLAN lists the plans cheapest first, and GROWTH holds every capability.
export const lowestPlanWithCapability = (
  capability: TCapability,
): TTenantPlan =>
  Object.values(TENANT_PLAN).find((plan) =>
    PLAN_REGISTRY[plan].includes(capability),
  ) ?? TENANT_PLAN.GROWTH;
