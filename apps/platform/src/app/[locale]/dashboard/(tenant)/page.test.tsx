import { DOMAIN_VERIFICATION_STATUS } from '@platform/constants/domain';
import messages from '@platform/i18n/messages/en.json';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockMembership } from '@platform/testing/memberships/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import {
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_ID,
  MOCK_TENANT_NAME,
  mockJoinedOwner,
  mockTenant,
} from '@platform/testing/tenants/fixtures';

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

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    memberships: {
      listMembershipsWithTenantsForUser: listMembershipsWithTenantsForUserMock,
      getTenantOwnerMembership: getTenantOwnerMembershipMock,
    },
    admins: { getAdminByUserId: getAdminByUserIdMock },
  },
}));

vi.mock('@platform/server/provisioning/get-domain-verification-status', () => ({
  getDomainVerificationStatus: getDomainVerificationStatusMock,
}));

const SITE_SETUP_HEADING = new RegExp(
  messages.ownerHomePage.siteSetupCardTitle,
);

const setup = customRenderAsync(DashboardOverviewPage, {});

describe(`<${DashboardOverviewPage.name}/>`, () => {
  beforeEach(async () => {
    listMembershipsWithTenantsForUserMock.mockResolvedValue([
      { membership: mockMembership(), tenant: mockTenant() },
    ]);
    getAdminByUserIdMock.mockResolvedValue(undefined);
    getTenantOwnerMembershipMock.mockResolvedValue(mockJoinedOwner());
    getDomainVerificationStatusMock.mockResolvedValue(
      DOMAIN_VERIFICATION_STATUS.VERIFIED,
    );

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
});
