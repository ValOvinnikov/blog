import { TENANT_PLAN, type TTenantPlan } from '@blog/db/constants';

export type TPlanChangeFields = {
  plan: TTenantPlan;
  selfServeOwnerEmailIndex?: null;
};

// A paid plan gives up the Free-site slot, so a later move back to Free never collides with the owner's other Free site.
export function planChangeFields(plan: TTenantPlan): TPlanChangeFields {
  return plan === TENANT_PLAN.FREE
    ? { plan }
    : { plan, selfServeOwnerEmailIndex: null };
}
