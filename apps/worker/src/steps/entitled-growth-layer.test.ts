import { SITE_TYPE } from '@shinefold/config/constants';
import { applyGrowthLayer } from '@worker/steps/apply-growth-layer';
import { mockTenant } from '@worker/testing/tenant/fixtures';
import { isGrowthLayerEntitled } from '@worker/utils/growth-layer/growth-layer-entitlement';

import { getEntitledGrowthLayer } from './entitled-growth-layer';

vi.mock('@worker/steps/apply-growth-layer');
vi.mock('@worker/utils/growth-layer/growth-layer-entitlement');

const applyLayer = vi.fn();

describe(getEntitledGrowthLayer, () => {
  beforeEach(() => {
    vi.mocked(isGrowthLayerEntitled).mockResolvedValue(true);
    vi.mocked(applyGrowthLayer).mockReturnValue(applyLayer);
  });

  it.each([
    [SITE_TYPE.PORTFOLIO, SITE_TYPE.PORTFOLIO],
    [null, SITE_TYPE.BLANK],
  ])(
    "builds the Growth layer for site type %s as %s in the tenant's locale",
    async (siteType, starterSiteType) => {
      const tenant = mockTenant({ siteType });

      await expect(getEntitledGrowthLayer(tenant)).resolves.toBe(applyLayer);

      expect(isGrowthLayerEntitled).toHaveBeenCalledWith(tenant);
      expect(applyGrowthLayer).toHaveBeenCalledWith({
        siteType: starterSiteType,
        locale: tenant.locale,
      });
    },
  );

  it('builds no layer when the tenant is not entitled to it', async () => {
    vi.mocked(isGrowthLayerEntitled).mockResolvedValue(false);

    await expect(getEntitledGrowthLayer(mockTenant())).resolves.toBeUndefined();

    expect(applyGrowthLayer).not.toHaveBeenCalled();
  });
});
