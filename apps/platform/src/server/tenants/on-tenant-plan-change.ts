import 'server-only';

import { notifyOwnerOfPlanChange } from '@platform/server/tenants/notify-owner-of-plan-change';
import type { TTenantPlan } from '@shinefold/config/constants';

/** The one step every plan change runs once its write has landed, whether an operator or Stripe made it. */
export const onTenantPlanChange = async (
  tenantId: string,
  fromPlan: TTenantPlan,
  toPlan: TTenantPlan,
): Promise<void> => {
  await notifyOwnerOfPlanChange(tenantId, fromPlan, toPlan);
};
