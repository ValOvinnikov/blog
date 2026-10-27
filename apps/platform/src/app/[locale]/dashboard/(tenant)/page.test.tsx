import { NEXT_NAVIGATION_ERROR, type TMaybeNull } from '@blog/config';
import type { TTenant } from '@blog/db/schema/tenants';
import { DOMAIN_VERIFICATION_STATUS } from '@platform/constants/domain';
import { auth } from '@platform/server/auth/auth';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockMembership } from '@platform/testing/memberships/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import {
  mockReadyTenant,
  mockTenant,
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_NAME,
  MOCK_TENANT_ID,
  mockJoinedOwner,
} from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';

import DashboardOverviewPage from './page';

const {
  listMembershipsWithTenantsForUserMock,
  getAdminByUserIdMock,
  getTenantOwnerMembershipMock,
  getDomainVerificationStatusMock,
  cookiesMock,
} = vi.hoisted(() => ({
  listMembershipsWithTenantsForUserMock: vi.fn(),
  getAdminByUserIdMock: vi.fn(),
  getTenantOwnerMembershipMock: vi.fn(),
  getDomainVerificationStatusMock: vi.fn(),
  cookiesMock: vi.fn(),
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

vi.mock('next/headers', () => ({
  cookies: cookiesMock,
  headers: async () => new Headers(),
}));

const authMock = vi.mocked<() => Promise<TMaybeNull<Partial<Session>>>>(auth);

const membership = mockMembership();

const setup = customRenderAsync(DashboardOverviewPage, {});

const renderForTenant = async (tenant: TTenant) => {
  listMembershipsWithTenantsForUserMock.mockResolvedValue([
    { membership, tenant },
  ]);
  await setup();
};

describe(`<${DashboardOverviewPage.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset();
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    listMembershipsWithTenantsForUserMock.mockReset();
    getAdminByUserIdMock.mockReset();
    getAdminByUserIdMock.mockResolvedValue(undefined);
    getTenantOwnerMembershipMock.mockReset();
    getTenantOwnerMembershipMock.mockResolvedValue(
      mockJoinedOwner('owner@example.com'),
    );
    getDomainVerificationStatusMock.mockReset();
    getDomainVerificationStatusMock.mockResolvedValue(
      DOMAIN_VERIFICATION_STATUS.VERIFIED,
    );
    cookiesMock.mockReset();
  });

  it('redirects to sign-in without querying memberships when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(redirect).toHaveBeenCalledWith(adminRoutes.signIn());
    expect(getDomainVerificationStatusMock).not.toHaveBeenCalled();
  });

  it('renders the owner home for a member with exactly one membership', async () => {
    await renderForTenant(
      mockTenant({
        id: MOCK_TENANT_ID,
        name: MOCK_TENANT_NAME,
        primaryDomain: MOCK_TENANT_DOMAIN,
      }),
    );

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
    expect(redirect).not.toHaveBeenCalled();
  });

  it('renders the owner home without waiting for the Vercel domain status', async () => {
    getDomainVerificationStatusMock.mockReturnValue(new Promise(() => {}));

    await renderForTenant(mockTenant({ id: MOCK_TENANT_ID }));

    const tenantHeading = screen.getByRole('heading', {
      level: 1,
      name: MOCK_TENANT_NAME,
    });
    const ownerHeading = screen.getByRole('heading', {
      level: 2,
      name: 'Owner',
    });
    const skeletons = screen.getAllByTestId('skeleton');

    expect(tenantHeading).toBeVisible();
    expect(ownerHeading).toBeVisible();
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("shows the owner their site's setup progress while provisioning runs", async () => {
    await renderForTenant(mockTenant({ id: MOCK_TENANT_ID }));

    const setupHeading = screen.getByRole('heading', {
      level: 2,
      name: /Setting up your site/,
    });

    expect(setupHeading).toBeVisible();
  });

  it('shows no setup progress once provisioning is ready', async () => {
    await renderForTenant(mockReadyTenant({ id: MOCK_TENANT_ID }));

    const setupHeading = screen.queryByRole('heading', {
      name: /Setting up your site/,
    });

    expect(setupHeading).not.toBeInTheDocument();
  });
});
