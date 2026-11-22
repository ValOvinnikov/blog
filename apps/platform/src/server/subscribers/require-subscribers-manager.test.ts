import { requireTenantManager } from '@platform/server/auth/require-tenant-manager';
import { mockMembershipContext } from '@platform/testing/memberships/fixtures';
import {
  mockReadyTenant,
  MOCK_TENANT_ID,
} from '@platform/testing/tenants/fixtures';
import {
  NEXT_NAVIGATION_ERROR,
  TENANT_PLAN,
  type TTenantPlan,
} from '@shinefold/config';

import { requireSubscribersManager } from './require-subscribers-manager';

vi.mock('@platform/server/auth/require-tenant-manager', () => ({
  requireTenantManager: vi.fn(),
}));

const contextOn = (plan: TTenantPlan) =>
  mockMembershipContext(mockReadyTenant({ id: MOCK_TENANT_ID, plan }));

describe(requireSubscribersManager, () => {
  it('admits a manager of a site whose plan includes the newsletter', async () => {
    const context = contextOn(TENANT_PLAN.GROWTH);
    vi.mocked(requireTenantManager).mockResolvedValue(context);

    await expect(requireSubscribersManager(MOCK_TENANT_ID)).resolves.toBe(
      context,
    );
    expect(requireTenantManager).toHaveBeenCalledWith(MOCK_TENANT_ID);
  });

  it.each([TENANT_PLAN.FREE, TENANT_PLAN.STARTER])(
    'refuses a %s site as not found',
    async (plan) => {
      vi.mocked(requireTenantManager).mockResolvedValue(contextOn(plan));

      await expect(requireSubscribersManager(MOCK_TENANT_ID)).rejects.toThrow(
        NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
      );
    },
  );
});
