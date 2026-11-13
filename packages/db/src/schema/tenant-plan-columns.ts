import { TENANT_PLAN } from '@blog/db/constants';
import { pgEnum } from 'drizzle-orm/pg-core';

export const tenantPlanEnum = pgEnum('tenant_plan', TENANT_PLAN);

export const tenantPlanColumns = {
  plan: tenantPlanEnum('plan').notNull(),
  downgradedFromPlan: tenantPlanEnum('downgraded_from_plan'),
};
