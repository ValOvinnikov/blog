import { DOMAIN_VERIFICATION_STATUS } from '@platform/constants/domain';
import messages from '@platform/i18n/messages/en.json';
import { loadUsageMeters } from '@platform/server/usage/load-usage-meters';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockedEnv } from '@platform/testing/env/mocked-env';
import { mockMembership } from '@platform/testing/memberships/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import {
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_ID,
  MOCK_TENANT_NAME,
  MOCK_MARKETING_SITE_URL,
  mockJoinedOwner,
  mockTenant,
} from '@platform/testing/tenants/fixtures';
import { noEntitlementGrantQueries } from '@platform/testing/tenants/no-entitlement-grant-queries';
import { adminRoutes } from '@platform/utils/routes/routes';
import { pricingPageUrl } from '@shinefold/config';
import { MEMBERSHIP_ROLE, type TMembershipRole } from '@shinefold/db/constants';

import DashboardOverviewPage from './page';

const {
  listMembershipsWithTenantsForUserMock,
  getAdminByUserIdMock,
  getTenantOwnerMembershipMock,
  getDomainVerificationStatusMock,
} = vi.hoisted(() => ({
  listMembershipsWithTenantsForUserMock: vi.fn(),
  getAdminByUserIdMock: vi.fn(),
  getTenantOwnerMembershipMock: vi.fn(),
  getDomainVerificationStatusMock: vi.fn(),
}));

vi.mock('@platform/server/auth/auth');

vi.mock('@shinefold/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    ...noEntitlementGrantQueries(),
    memberships: {
      listMembershipsWithTenantsForUser: listMembershipsWithTenantsForUserMock,
      getTenantOwnerMembership: getTenantOwnerMembershipMock,
    },
    admins: { getAdminByUserId: getAdminByUserIdMock },
  },
}));

vi.mock('@platform/server/usage/load-usage-meters');

vi.mock('@platform/utils/env/env');

vi.mock('@platform/server/provisioning/get-domain-verification-status', () => ({
  getDomainVerificationStatus: getDomainVerificationStatusMock,
}));

const SITE_SETUP_HEADING = new RegExp(
  messages.ownerHomePage.siteSetupCardTitle,
);

const PLANS_LINK = { name: messages.usageCard.footer.plansLink };

const setup = customRenderAsync(DashboardOverviewPage, {});

const arrangeViewer = (role: TMembershipRole) => {
  listMembershipsWithTenantsForUserMock.mockResolvedValue([
    { membership: mockMembership({ role }), tenant: mockTenant() },
  ]);
};

describe(`<${DashboardOverviewPage.name}/>`, () => {
  beforeEach(() => {
    mockedEnv.MARKETING_SITE_URL = MOCK_MARKETING_SITE_URL;
    getAdminByUserIdMock.mockResolvedValue(undefined);
    getTenantOwnerMembershipMock.mockResolvedValue(mockJoinedOwner());
    getDomainVerificationStatusMock.mockResolvedValue(
      DOMAIN_VERIFICATION_STATUS.VERIFIED,
    );
  });

  describe('for the owner', () => {
    beforeEach(async () => {
      arrangeViewer(MEMBERSHIP_ROLE.OWNER);
      await setup();
    });

    it("renders the owner home for the member's tenant", () => {
      const tenantHeading = screen.getByRole('heading', {
        level: 1,
        name: MOCK_TENANT_NAME,
      });

      expect(getDomainVerificationStatusMock).toHaveBeenCalledWith(
        MOCK_TENANT_DOMAIN,
      );
      expect(getTenantOwnerMembershipMock).toHaveBeenCalledExactlyOnceWith(
        MOCK_TENANT_ID,
      );
      expect(tenantHeading).toBeVisible();
    });

    it("shows the owner their site's setup progress while provisioning runs", () => {
      const setupHeading = screen.getByRole('heading', {
        level: 2,
        name: SITE_SETUP_HEADING,
      });

      expect(setupHeading).toBeVisible();
    });

    it('links the Usage card to the Languages and Team pages', () => {
      expect(loadUsageMeters).toHaveBeenCalledWith(expect.anything(), {
        languages: adminRoutes.dashboardLanguages(),
        team: adminRoutes.dashboardTeam(),
      });
    });

    it('links the plan comparison under the Usage card on a Free site', () => {
      const plansLink = screen.getByRole('link', PLANS_LINK);

      expect(plansLink).toHaveAttribute(
        'href',
        pricingPageUrl(MOCK_MARKETING_SITE_URL),
      );
    });
  });

  describe('for an editor', () => {
    beforeEach(async () => {
      arrangeViewer(MEMBERSHIP_ROLE.EDITOR);
      await setup();
    });

    it('leaves the Team link off the Usage card', () => {
      expect(loadUsageMeters).toHaveBeenCalledWith(expect.anything(), {
        languages: adminRoutes.dashboardLanguages(),
        team: undefined,
      });
    });

    it('shows no plan comparison under the Usage card', () => {
      const plansLink = screen.queryByRole('link', PLANS_LINK);

      expect(plansLink).not.toBeInTheDocument();
    });
  });
});
