import { UpgradePageContent } from '@platform/components/features/upgrade/upgrade-page-content';
import { UPGRADE_SEARCH_PARAM } from '@platform/constants/billing';
import { resolveDashboardTenant } from '@platform/server/auth/resolve-dashboard-tenant';
import {
  MOCK_CHECKOUT_SESSION_ID,
  MOCK_STRIPE_PROMOTION_CODE,
} from '@platform/testing/billing/fixtures';
import {
  mockMembership,
  mockViewer,
} from '@platform/testing/memberships/fixtures';
import { mockTenant } from '@platform/testing/tenants/fixtures';

import DashboardUpgradePage from './page';

vi.mock('@platform/server/auth/resolve-dashboard-tenant', () => ({
  resolveDashboardTenant: vi.fn(),
}));

vi.mock('@platform/components/features/upgrade/upgrade-page-content', () => ({
  UpgradePageContent: vi.fn(async () => null),
}));

const MOCK_CONTEXT = {
  tenant: mockTenant(),
  membership: mockMembership(),
  viewer: mockViewer(),
  tenants: [mockTenant()],
};

describe(`<${DashboardUpgradePage.name}/>`, () => {
  beforeEach(() => {
    vi.mocked(resolveDashboardTenant).mockResolvedValue(MOCK_CONTEXT);
  });

  it("hands the session tenant and the checkout's query to the page", async () => {
    await DashboardUpgradePage({
      searchParams: Promise.resolve({
        [UPGRADE_SEARCH_PARAM.PROMO]: MOCK_STRIPE_PROMOTION_CODE,
        [UPGRADE_SEARCH_PARAM.SESSION_ID]: MOCK_CHECKOUT_SESSION_ID,
      }),
    });

    expect(UpgradePageContent).toHaveBeenCalledWith({
      ...MOCK_CONTEXT,
      promo: MOCK_STRIPE_PROMOTION_CODE,
      isReturning: true,
    });
  });
});
