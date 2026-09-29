import { auth } from '@platform/server/auth/auth';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';

import DashboardFeaturesPage from './page';

const {
  listMembershipsForUserMock,
  listTenantsByIdsMock,
  getAdminByUserIdMock,
  getSettingsFeaturesMock,
  getSiteConfigMock,
} = vi.hoisted(() => ({
  listMembershipsForUserMock: vi.fn(),
  listTenantsByIdsMock: vi.fn(),
  getAdminByUserIdMock: vi.fn(),
  getSettingsFeaturesMock: vi.fn(),
  getSiteConfigMock: vi.fn(),
}));

vi.mock('@platform/server/auth/auth');

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    memberships: { listMembershipsForUser: listMembershipsForUserMock },
    tenants: { listTenantsByIds: listTenantsByIdsMock },
    admins: { getAdminByUserId: getAdminByUserIdMock },
    settingsFeatures: { getSettingsFeatures: getSettingsFeaturesMock },
    siteConfig: { getSiteConfig: getSiteConfigMock },
  },
}));

const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);

const setup = customRenderAsync(DashboardFeaturesPage, {});

describe(`<${DashboardFeaturesPage.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset();
    listMembershipsForUserMock.mockReset();
    listTenantsByIdsMock.mockReset();
    getAdminByUserIdMock.mockReset();
    getSettingsFeaturesMock.mockReset();
    getSiteConfigMock.mockReset();

    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getAdminByUserIdMock.mockResolvedValue(undefined);
    listMembershipsForUserMock.mockResolvedValue([
      { id: 'm-1', userId: 'user-1', tenantId: 'tenant-1', role: 'OWNER' },
    ]);
    listTenantsByIdsMock.mockResolvedValue([{ id: 'tenant-1', plan: 'FREE' }]);
  });

  it('redirects to sign-in without a session', async () => {
    authMock.mockResolvedValue(null);

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/api/auth/signin');
    expect(getSettingsFeaturesMock).not.toHaveBeenCalled();
  });

  it("renders the resolved tenant's Features form", async () => {
    getSettingsFeaturesMock.mockResolvedValue(undefined);
    getSiteConfigMock.mockResolvedValue(undefined);

    await setup();

    expect(getSettingsFeaturesMock).toHaveBeenCalledWith('tenant-1');
    expect(screen.getByRole('heading', { name: 'Features' })).toBeVisible();
  });
});
