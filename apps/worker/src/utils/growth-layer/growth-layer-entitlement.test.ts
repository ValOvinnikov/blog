import { MODULE_PACK, TENANT_PLAN } from '@shinefold/config/constants';
import { PLAN_ENTITLEMENTS } from '@shinefold/db/constants';
import { getTenantEntitlements } from '@shinefold/db/queries/tenant-entitlement-grants';
import { MOCK_TENANT_ID } from '@worker/testing/tenant/fixtures';

import { isGrowthLayerEntitled } from './growth-layer-entitlement';

vi.mock('@shinefold/db/queries/tenant-entitlement-grants');

const MOCK_STARTER_TENANT = { id: MOCK_TENANT_ID, plan: TENANT_PLAN.STARTER };

function resolvesModulePacks(
  modulePacks: (typeof PLAN_ENTITLEMENTS)[typeof TENANT_PLAN.STARTER]['modulePacks'],
) {
  vi.mocked(getTenantEntitlements).mockResolvedValue({
    ...PLAN_ENTITLEMENTS[TENANT_PLAN.STARTER],
    modulePacks,
    capabilities: [],
    localeLimit: 1,
  });
}

describe(isGrowthLayerEntitled, () => {
  it('is entitled when the resolved module packs include Growth, grants included', async () => {
    resolvesModulePacks([MODULE_PACK.CORE, MODULE_PACK.GROWTH]);

    await expect(isGrowthLayerEntitled(MOCK_STARTER_TENANT)).resolves.toBe(
      true,
    );
    expect(getTenantEntitlements).toHaveBeenCalledWith(MOCK_STARTER_TENANT);
  });

  it('is not entitled without the Growth module pack', async () => {
    resolvesModulePacks([MODULE_PACK.CORE, MODULE_PACK.STARTER]);

    await expect(isGrowthLayerEntitled(MOCK_STARTER_TENANT)).resolves.toBe(
      false,
    );
  });
});
