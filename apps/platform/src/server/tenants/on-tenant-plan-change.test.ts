import { enqueueGrowthLayerOnUpgrade } from '@platform/server/growth-layer/enqueue-growth-layer-on-upgrade';
import { notifyOwnerOfPlanChange } from '@platform/server/tenants/notify-owner-of-plan-change';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { TENANT_PLAN } from '@shinefold/config/constants';

import { onTenantPlanChange } from './on-tenant-plan-change';

vi.mock('@platform/server/growth-layer/enqueue-growth-layer-on-upgrade');
vi.mock('@platform/server/tenants/notify-owner-of-plan-change', () => ({
  notifyOwnerOfPlanChange: vi.fn(),
}));

const { STARTER, GROWTH } = TENANT_PLAN;

describe(onTenantPlanChange, () => {
  it('tells the owner and offers the Growth layer for the same move', async () => {
    await onTenantPlanChange(MOCK_TENANT_ID, STARTER, GROWTH);

    expect(notifyOwnerOfPlanChange).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      STARTER,
      GROWTH,
    );
    expect(enqueueGrowthLayerOnUpgrade).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      STARTER,
      GROWTH,
    );
  });
});
