import type { TCapability } from '@blog/config';
import {
  PLAN_REGISTRY,
  TENANT_PLAN,
  type TTenantPlan,
} from '@blog/db/constants';

// TENANT_PLAN lists the plans cheapest first, and GROWTH holds every capability.
export const lowestPlanWithCapability = (
  capability: TCapability,
): TTenantPlan =>
  Object.values(TENANT_PLAN).find((plan) =>
    PLAN_REGISTRY[plan].includes(capability),
  ) ?? TENANT_PLAN.GROWTH;
