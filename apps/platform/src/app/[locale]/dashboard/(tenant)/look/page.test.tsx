import { auth } from '@platform/server/auth/auth';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';

import DashboardLookPage from './page';

const {
  listMembershipsWithTenantsForUserMock,
  getAdminByUserIdMock,
  getSiteConfigMock,
} = vi.hoisted(() => ({
  listMembershipsWithTenantsForUserMock: vi.fn(),
  getAdminByUserIdMock: vi.fn(),
  getSiteConfigMock: vi.fn(),
}));

vi.mock('@platform/server/auth/auth');

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    memberships: {
      listMembershipsWithTenantsForUser: listMembershipsWithTenantsForUserMock,
    },
    tenants: {
      selectLiveLocales: vi.fn().mockReturnValue(['EN']),
    },
    admins: { getAdminByUserId: getAdminByUserIdMock },
    siteConfig: { getSiteConfig: getSiteConfigMock },
  },
}));

const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);

const membership = {
  id: 'm-1',
  userId: 'user-1',
  tenantId: 'tenant-1',
  role: 'OWNER',
};

const setup = customRenderAsync(DashboardLookPage, {});

describe(`<${DashboardLookPage.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset();
    listMembershipsWithTenantsForUserMock.mockReset();
    getAdminByUserIdMock.mockReset();
    getSiteConfigMock.mockReset();

    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getAdminByUserIdMock.mockResolvedValue(undefined);
    listMembershipsWithTenantsForUserMock.mockResolvedValue([
      { membership, tenant: { id: 'tenant-1' } },
    ]);
  });

  it('redirects to sign-in without a session', async () => {
    authMock.mockResolvedValue(null);

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/api/auth/signin');
    expect(getSiteConfigMock).not.toHaveBeenCalled();
  });

  it("renders the resolved tenant's Look form", async () => {
    getSiteConfigMock.mockResolvedValue(undefined);

    await setup();

    expect(getSiteConfigMock).toHaveBeenCalledWith('tenant-1');
    expect(screen.getByRole('heading', { name: 'Look' })).toBeVisible();
  });
});
