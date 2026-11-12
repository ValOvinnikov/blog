import 'server-only';

import type { TTenantPlan } from '@blog/db';
import { notifyOwnerOfPlanChange } from '@platform/server/tenants/notify-owner-of-plan-change';

/** The one step every plan change runs once its write has landed, whether an operator or Stripe made it. */
export const onTenantPlanChange = async (
  tenantId: string,
  fromPlan: TTenantPlan,
  toPlan: TTenantPlan,
): Promise<void> => {
  await notifyOwnerOfPlanChange(tenantId, fromPlan, toPlan);
};
