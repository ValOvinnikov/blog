import { TENANT_PLAN, type TTenantPlan } from '@blog/config/constants';
import { TENANT_STATUS, type TTenantStatus } from '@blog/db/constants';

export type TPlanChangeFields = {
  plan: TTenantPlan;
  selfServeOwnerEmailIndex?: null;
};

const PAID_SITE_STATUSES: readonly TTenantStatus[] = [
  TENANT_STATUS.ACTIVE,
  TENANT_STATUS.PAST_DUE,
];

// Only a move to a paid, running site gives up the Free-or-trial slot; a trial or a suspended site keeps it.
export function planChangeFields(
  plan: TTenantPlan,
  status: TTenantStatus,
): TPlanChangeFields {
  return plan !== TENANT_PLAN.FREE && PAID_SITE_STATUSES.includes(status)
    ? { plan, selfServeOwnerEmailIndex: null }
    : { plan };
}
