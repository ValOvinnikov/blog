import {
  PLAN_PRICE_LOOKUP_KEYS,
  TENANT_PLAN,
  type TTenantPlan,
} from '@blog/db/constants';
import { isNull } from '@blog/utils/primitives';

export const isSellablePlan = (plan: TTenantPlan): boolean =>
  !isNull(PLAN_PRICE_LOOKUP_KEYS[plan]);

export const SELLABLE_PLANS: readonly TTenantPlan[] =
  Object.values(TENANT_PLAN).filter(isSellablePlan);
