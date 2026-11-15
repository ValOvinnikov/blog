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
import { mockCookies } from '@platform/testing/mock-cookies';
import { mockTenant } from '@platform/testing/tenants/fixtures';
import { SIGNUP_PROMO_COOKIE } from '@platform/utils/signup-promo-cookie/signup-promo-cookie';

import DashboardUpgradePage from './page';

vi.mock('@platform/server/auth/resolve-dashboard-tenant', () => ({
  resolveDashboardTenant: vi.fn(),
}));

vi.mock('next/headers', () => ({ cookies: vi.fn() }));

vi.mock('@platform/components/features/upgrade/upgrade-page-content', () => ({
  UpgradePageContent: vi.fn(async () => null),
}));

const MOCK_SIGNUP_PROMO = `${MOCK_STRIPE_PROMOTION_CODE}SIGNUP`;

const MOCK_CONTEXT = {
  tenant: mockTenant(),
  membership: mockMembership(),
  viewer: mockViewer(),
  tenants: [mockTenant()],
};

describe(`<${DashboardUpgradePage.name}/>`, () => {
  beforeEach(() => {
    vi.mocked(resolveDashboardTenant).mockResolvedValue(MOCK_CONTEXT);
    mockCookies({});
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

  describe('with a promo code remembered at signup', () => {
    beforeEach(() => {
      mockCookies({ [SIGNUP_PROMO_COOKIE]: MOCK_SIGNUP_PROMO });
    });

    it('falls back to it when the address has none', async () => {
      await DashboardUpgradePage({ searchParams: Promise.resolve({}) });

      expect(UpgradePageContent).toHaveBeenCalledWith({
        ...MOCK_CONTEXT,
        promo: MOCK_SIGNUP_PROMO,
        isReturning: false,
      });
    });

    it("prefers the address's promo code", async () => {
      await DashboardUpgradePage({
        searchParams: Promise.resolve({
          [UPGRADE_SEARCH_PARAM.PROMO]: MOCK_STRIPE_PROMOTION_CODE,
        }),
      });

      expect(UpgradePageContent).toHaveBeenCalledWith({
        ...MOCK_CONTEXT,
        promo: MOCK_STRIPE_PROMOTION_CODE,
        isReturning: false,
      });
    });
  });
});
