import { toStarterSiteType, type TMaybeUndefined } from '@shinefold/config';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { applyGrowthLayer } from '@worker/steps/apply-growth-layer';
import type { TAfterSeed } from '@worker/steps/seed-content';
import { isGrowthLayerEntitled } from '@worker/utils/growth-layer/growth-layer-entitlement';

export async function getEntitledGrowthLayer(
  tenant: Pick<TTenant, 'id' | 'plan' | 'siteType' | 'locale'>,
): Promise<TMaybeUndefined<TAfterSeed>> {
  if (!(await isGrowthLayerEntitled(tenant))) return undefined;

  return applyGrowthLayer({
    siteType: toStarterSiteType(tenant.siteType),
    locale: tenant.locale,
  });
}
