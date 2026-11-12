import {
  TENANT_PLAN,
  TENANT_STATUS,
  type TTenantPlan,
  type TTenantStatus,
} from '@blog/db/constants';

export type TPlanChangeFields = {
  plan: TTenantPlan;
  selfServeOwnerEmailIndex?: null;
};

// A paid site gives up the Free-or-trial slot, so a later move back to Free never collides; a trial is on a paid plan but still holds it.
export function planChangeFields(
  plan: TTenantPlan,
  status: TTenantStatus,
): TPlanChangeFields {
  return plan === TENANT_PLAN.FREE || status === TENANT_STATUS.TRIAL
    ? { plan }
    : { plan, selfServeOwnerEmailIndex: null };
}
