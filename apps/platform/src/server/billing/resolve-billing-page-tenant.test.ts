import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import { resolveDashboardTenant } from '@platform/server/auth/resolve-dashboard-tenant';
import { resolveTenantPageAccess } from '@platform/server/auth/resolve-tenant-page-access';
import { mockMembership } from '@platform/testing/memberships/fixtures';
import { mockReadyTenant } from '@platform/testing/tenants/fixtures';
import { EVERY_PLAN_PAGE } from '@platform/utils/plan-page-access/plan-page-access';

import { resolveBillingPageTenant } from './resolve-billing-page-tenant';

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

const resolveDashboardTenantMock = vi.mocked(resolveDashboardTenant);
const resolveTenantPageAccessMock = vi.mocked(resolveTenantPageAccess);

describe(resolveBillingPageTenant, () => {
  beforeEach(() => {
    resolveDashboardTenantMock.mockResolvedValue(MOCK_CONTEXT);
  });

  it('never reaches the access check without a session', async () => {
    resolveDashboardTenantMock.mockRejectedValue(MOCK_SIGN_IN_REDIRECT);

    await expect(resolveBillingPageTenant()).rejects.toBe(
      MOCK_SIGN_IN_REDIRECT,
    );
    expect(resolveTenantPageAccessMock).not.toHaveBeenCalled();
  });

  it('is not found for a member who cannot see Billing', async () => {
    resolveTenantPageAccessMock.mockResolvedValue({
      ...EVERY_PLAN_PAGE,
      billing: false,
    });

    await expect(resolveBillingPageTenant()).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );
  });

  it('returns the dashboard tenant to its owner', async () => {
    resolveTenantPageAccessMock.mockResolvedValue(EVERY_PLAN_PAGE);

    await expect(resolveBillingPageTenant()).resolves.toBe(MOCK_CONTEXT);
    expect(resolveTenantPageAccessMock).toHaveBeenCalledWith(
      MOCK_CONTEXT.tenant,
      MOCK_CONTEXT.membership,
    );
  });
});
