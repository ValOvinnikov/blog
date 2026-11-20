'use server';

import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import type { TMaybeNull } from '@shinefold/config';
import type { TPaidSubscriberBandCeiling } from '@shinefold/db/constants';

export const getTenantBandAction = async (
  tenantId: string,
): Promise<TMaybeNull<TPaidSubscriberBandCeiling>> => {
  const { tenant } = await requireTenantMembership(tenantId);
  return tenant.subscriberBandCeiling;
};
