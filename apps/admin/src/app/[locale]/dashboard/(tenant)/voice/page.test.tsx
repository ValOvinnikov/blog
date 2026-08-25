import { customRenderAsync, screen } from '@admin/testing/custom-render';
import { mockDbConstants } from '@admin/testing/mock-db-constants';
import { redirect } from 'next/navigation';

import DashboardVoicePage from './page';

const {
  authMock,
  listMembershipsForUserMock,
  listTenantsByIdsMock,
  getAdminByUserIdMock,
  getSiteConfigMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  listMembershipsForUserMock: vi.fn(),
  listTenantsByIdsMock: vi.fn(),
  getAdminByUserIdMock: vi.fn(),
  getSiteConfigMock: vi.fn(),
}));

vi.mock('@admin/server/auth/auth', () => ({ auth: authMock }));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    memberships: { listMembershipsForUser: listMembershipsForUserMock },
    tenants: { listTenantsByIds: listTenantsByIdsMock },
    admins: { getAdminByUserId: getAdminByUserIdMock },
    siteConfig: { getSiteConfig: getSiteConfigMock },
  },
}));

const setup = customRenderAsync(DashboardVoicePage, {});

describe(`<${DashboardVoicePage.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset();
    listMembershipsForUserMock.mockReset();
    listTenantsByIdsMock.mockReset();
    getAdminByUserIdMock.mockReset();
    getSiteConfigMock.mockReset();
    vi.mocked(redirect).mockClear();

    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getAdminByUserIdMock.mockResolvedValue(undefined);
    listMembershipsForUserMock.mockResolvedValue([
      { id: 'm-1', userId: 'user-1', tenantId: 'tenant-1', role: 'OWNER' },
    ]);
    listTenantsByIdsMock.mockResolvedValue([{ id: 'tenant-1', slug: 'acme' }]);
  });

  it('redirects to sign-in without a session', async () => {
    authMock.mockResolvedValue(null);

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/api/auth/signin');
    expect(getSiteConfigMock).not.toHaveBeenCalled();
  });

  it("renders the resolved tenant's Voice settings", async () => {
    getSiteConfigMock.mockResolvedValue(undefined);

    await setup();

    expect(getSiteConfigMock).toHaveBeenCalledWith('tenant-1');
    expect(screen.getByRole('heading', { name: 'Voice' })).toBeVisible();
  });
});
