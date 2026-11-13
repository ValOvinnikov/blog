'use server';

import type { TTenantPlan } from '@blog/config/constants';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';

export const getTenantPlanAction = async (
  tenantId: string,
): Promise<TTenantPlan> => {
  const { tenant } = await requireTenantMembership(tenantId);
  return tenant.plan;
};
