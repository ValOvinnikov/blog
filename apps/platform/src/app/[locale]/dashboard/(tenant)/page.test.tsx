import type { TTenant } from '@blog/db/schema/tenants';
import { DOMAIN_VERIFICATION_STATUS } from '@platform/constants/domain';
import { auth } from '@platform/server/auth/auth';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { makeMembership } from '@platform/testing/memberships/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import {
  makeReadyTenant,
  makeTenant,
} from '@platform/testing/tenants/fixtures';
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

const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);

const membership = makeMembership();

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
    getTenantOwnerMembershipMock.mockResolvedValue({
      email: 'owner@example.com',
      joinedAt: new Date('2026-08-12T00:00:00.000Z'),
    });
    getDomainVerificationStatusMock.mockReset();
    getDomainVerificationStatusMock.mockResolvedValue(
      DOMAIN_VERIFICATION_STATUS.VERIFIED,
    );
    cookiesMock.mockReset();
  });

  it('redirects to sign-in without querying memberships when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/api/auth/signin?callbackUrl=%2F');
    expect(getDomainVerificationStatusMock).not.toHaveBeenCalled();
  });

  it('renders the owner home for a member with exactly one membership', async () => {
    await renderForTenant(
      makeTenant({
        id: 'tenant-1',
        name: 'Acme Inc.',
        primaryDomain: 'acme.example.com',
      }),
    );

    const tenantHeading = screen.getByRole('heading', {
      level: 1,
      name: 'Acme Inc.',
    });

    expect(getDomainVerificationStatusMock).toHaveBeenCalledWith(
      'acme.example.com',
    );
    expect(getTenantOwnerMembershipMock).toHaveBeenCalledExactlyOnceWith(
      'tenant-1',
    );
    expect(tenantHeading).toBeVisible();
    expect(redirect).not.toHaveBeenCalled();
  });

  it('renders the owner home without waiting for the Vercel domain status', async () => {
    getDomainVerificationStatusMock.mockReturnValue(new Promise(() => {}));

    await renderForTenant(makeTenant({ id: 'tenant-1', name: 'Acme Inc.' }));

    const tenantHeading = screen.getByRole('heading', {
      level: 1,
      name: 'Acme Inc.',
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
    await renderForTenant(makeTenant({ id: 'tenant-1' }));

    const setupHeading = screen.getByRole('heading', {
      level: 2,
      name: /Setting up your site/,
    });

    expect(setupHeading).toBeVisible();
  });

  it('shows no setup progress once provisioning is ready', async () => {
    await renderForTenant(makeReadyTenant({ id: 'tenant-1' }));

    const setupHeading = screen.queryByRole('heading', {
      name: /Setting up your site/,
    });

    expect(setupHeading).not.toBeInTheDocument();
  });
});
