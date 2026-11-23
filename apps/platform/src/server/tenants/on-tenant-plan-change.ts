import 'server-only';

import { enqueueGrowthLayerOnUpgrade } from '@platform/server/growth-layer/enqueue-growth-layer-on-upgrade';
import { notifyOwnerOfPlanChange } from '@platform/server/tenants/notify-owner-of-plan-change';
import type { TTenantPlan } from '@shinefold/config/constants';

/** The one step every plan change runs once its write has landed, whether an operator or Stripe made it. */
export const onTenantPlanChange = async (
  tenantId: string,
  fromPlan: TTenantPlan,
  toPlan: TTenantPlan,
): Promise<void> => {
  await Promise.all([
    notifyOwnerOfPlanChange(tenantId, fromPlan, toPlan),
    enqueueGrowthLayerOnUpgrade(tenantId, fromPlan, toPlan),
  ]);
};
