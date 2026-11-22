import { ensureGrowthLayerApplied } from '@worker/units/ensure-growth-layer-applied';

export async function applyGrowthLayerOnUpgrade(
  tenantId: string,
): Promise<void> {
  'use workflow';

  await ensureGrowthLayerApplied(tenantId);
}
