'use server';

import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import type { TTenantPlan } from '@shinefold/config/constants';

export const getTenantPlanAction = async (
  tenantId: string,
): Promise<TTenantPlan> => {
  const { tenant } = await requireTenantMembership(tenantId);
  return tenant.plan;
};
