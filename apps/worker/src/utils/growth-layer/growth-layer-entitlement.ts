import { MODULE_PACK } from '@shinefold/config/constants';
import { getTenantEntitlements } from '@shinefold/db/queries/tenant-entitlement-grants';
import type { TTenant } from '@shinefold/db/schema/tenants';

export async function isGrowthLayerEntitled(
  tenant: Pick<TTenant, 'id' | 'plan'>,
): Promise<boolean> {
  const { modulePacks } = await getTenantEntitlements(tenant);
  return modulePacks.includes(MODULE_PACK.GROWTH);
}
