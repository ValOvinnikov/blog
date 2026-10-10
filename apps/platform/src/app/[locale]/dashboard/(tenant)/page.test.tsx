import { DOMAIN_VERIFICATION_STATUS } from '@platform/constants/domain';
import { auth } from '@platform/server/auth/auth';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { makeTenant } from '@platform/testing/tenants/fixtures';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';

import DashboardOverviewPage from './page';

const {
  listMembershipsForUserMock,
  listTenantsByIdsMock,
  getAdminByUserIdMock,
  getTenantOwnerEmailMock,
  getTenantOwnerMembershipMock,
  getDomainVerificationStatusMock,
  cookiesMock,
} = vi.hoisted(() => ({
  listMembershipsForUserMock: vi.fn(),
  listTenantsByIdsMock: vi.fn(),
  getAdminByUserIdMock: vi.fn(),
  getTenantOwnerEmailMock: vi.fn(),
  getTenantOwnerMembershipMock: vi.fn(),
  getDomainVerificationStatusMock: vi.fn(),
  cookiesMock: vi.fn(),
}));

vi.mock('@platform/server/auth/auth');

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    memberships: {
      listMembershipsForUser: listMembershipsForUserMock,
      getTenantOwnerEmail: getTenantOwnerEmailMock,
      getTenantOwnerMembership: getTenantOwnerMembershipMock,
    },
    tenants: { listTenantsByIds: listTenantsByIdsMock },
    admins: { getAdminByUserId: getAdminByUserIdMock },
  },
}));

vi.mock('@platform/server/provisioning/get-domain-verification-status', () => ({
  getDomainVerificationStatus: getDomainVerificationStatusMock,
}));

vi.mock('next/headers', () => ({ cookies: cookiesMock }));

const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);

const setup = customRenderAsync(DashboardOverviewPage, {});

describe(`<${DashboardOverviewPage.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset();
    listMembershipsForUserMock.mockReset();
    listTenantsByIdsMock.mockReset();
    getAdminByUserIdMock.mockReset();
    getAdminByUserIdMock.mockResolvedValue(undefined);
    getTenantOwnerEmailMock.mockReset();
    getTenantOwnerEmailMock.mockResolvedValue('owner@example.com');
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

    expect(redirect).toHaveBeenCalledWith('/api/auth/signin');
    expect(getDomainVerificationStatusMock).not.toHaveBeenCalled();
  });

  it('renders the owner home for a member with exactly one membership', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    listMembershipsForUserMock.mockResolvedValue([
      { id: 'm-1', userId: 'user-1', tenantId: 'tenant-1', role: 'OWNER' },
    ]);
    const tenant = makeTenant({
      id: 'tenant-1',
      name: 'Acme Inc.',
      primaryDomain: 'acme.example.com',
    });
    listTenantsByIdsMock.mockResolvedValue([tenant]);

    await setup();

    expect(getDomainVerificationStatusMock).toHaveBeenCalledWith(
      'acme.example.com',
    );
    expect(getTenantOwnerEmailMock).toHaveBeenCalledWith('tenant-1');
    expect(getTenantOwnerMembershipMock).toHaveBeenCalledWith('tenant-1');
    expect(
      screen.getByRole('heading', { level: 1, name: 'Acme Inc.' }),
    ).toBeVisible();
    expect(redirect).not.toHaveBeenCalled();
  });

  it('renders the owner home without waiting for the Vercel domain status', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    listMembershipsForUserMock.mockResolvedValue([
      { id: 'm-1', userId: 'user-1', tenantId: 'tenant-1', role: 'OWNER' },
    ]);
    listTenantsByIdsMock.mockResolvedValue([
      makeTenant({ id: 'tenant-1', name: 'Acme Inc.' }),
    ]);
    getDomainVerificationStatusMock.mockReturnValue(new Promise(() => {}));

    await setup();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Acme Inc.' }),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Owner' }),
    ).toBeVisible();
    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
  });
});
