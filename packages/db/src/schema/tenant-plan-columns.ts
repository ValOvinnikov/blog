import { tenantPlanEnum } from './tenant-enums';

export const tenantPlanColumns = {
  plan: tenantPlanEnum('plan').notNull(),
  downgradedFromPlan: tenantPlanEnum('downgraded_from_plan'),
};
