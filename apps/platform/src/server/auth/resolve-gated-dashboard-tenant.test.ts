import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import { resolveDashboardTenant } from '@platform/server/auth/resolve-dashboard-tenant';
import { resolveTenantPageAccess } from '@platform/server/auth/resolve-tenant-page-access';
import { mockMembership } from '@platform/testing/memberships/fixtures';
import { mockReadyTenant } from '@platform/testing/tenants/fixtures';
import { EVERY_PLAN_PAGE } from '@platform/utils/plan-page-access/plan-page-access';

import { resolveGatedDashboardTenant } from './resolve-gated-dashboard-tenant';

vi.mock('@platform/server/auth/resolve-dashboard-tenant', () => ({
  resolveDashboardTenant: vi.fn(),
}));
vi.mock('@platform/server/auth/resolve-tenant-page-access', () => ({
  resolveTenantPageAccess: vi.fn(),
}));

const MOCK_CONTEXT = {
  tenant: mockReadyTenant(),
  membership: mockMembership(),
  tenants: [],
};
const MOCK_SIGN_IN_REDIRECT = new Error(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);
const GATED_PAGES = ['leads', 'billing'] as const;

const resolveDashboardTenantMock = vi.mocked(resolveDashboardTenant);
const resolveTenantPageAccessMock = vi.mocked(resolveTenantPageAccess);

describe(resolveGatedDashboardTenant, () => {
  beforeEach(() => {
    resolveDashboardTenantMock.mockResolvedValue(MOCK_CONTEXT);
  });

  it('never reaches the access check without a session', async () => {
    resolveDashboardTenantMock.mockRejectedValue(MOCK_SIGN_IN_REDIRECT);

    await expect(resolveGatedDashboardTenant('billing')()).rejects.toBe(
      MOCK_SIGN_IN_REDIRECT,
    );
    expect(resolveTenantPageAccessMock).not.toHaveBeenCalled();
  });

  it.each(GATED_PAGES)(
    'is not found for a member who cannot open %s',
    async (page) => {
      resolveTenantPageAccessMock.mockResolvedValue({
        ...EVERY_PLAN_PAGE,
        [page]: false,
      });

      await expect(resolveGatedDashboardTenant(page)()).rejects.toThrow(
        NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
      );
    },
  );

  it.each(GATED_PAGES)(
    'returns the dashboard tenant to a member who can open %s',
    async (page) => {
      resolveTenantPageAccessMock.mockResolvedValue(EVERY_PLAN_PAGE);

      await expect(resolveGatedDashboardTenant(page)()).resolves.toBe(
        MOCK_CONTEXT,
      );
      expect(resolveTenantPageAccessMock).toHaveBeenCalledWith(
        MOCK_CONTEXT.tenant,
        MOCK_CONTEXT.membership,
      );
    },
  );
});
