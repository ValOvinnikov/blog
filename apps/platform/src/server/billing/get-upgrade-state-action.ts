'use server';

import type { TUpgradeState } from '@platform/constants/billing';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';

import { upgradeStateFor } from './upgrade-state-for';

export const getUpgradeStateAction = async (
  tenantId: string,
): Promise<TUpgradeState> => {
  const { tenant, viewer } = await requireTenantMembership(tenantId);
  return upgradeStateFor(tenant, viewer);
};
