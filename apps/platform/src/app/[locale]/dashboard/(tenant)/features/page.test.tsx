import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import { MEMBERSHIP_ROLE, TENANT_PLAN } from '@blog/db/constants';
import { auth } from '@platform/server/auth/auth';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';

import DashboardFeaturesPage from './page';

const {
  listMembershipsWithTenantsForUserMock,
  getAdminByUserIdMock,
  getSettingsFeaturesAndPresetMock,
} = vi.hoisted(() => ({
  listMembershipsWithTenantsForUserMock: vi.fn(),
  getAdminByUserIdMock: vi.fn(),
  getSettingsFeaturesAndPresetMock: vi.fn(),
}));

vi.mock('@platform/server/auth/auth');

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    memberships: {
      listMembershipsWithTenantsForUser: listMembershipsWithTenantsForUserMock,
    },
    admins: { getAdminByUserId: getAdminByUserIdMock },
    settingsFeatures: {
      getSettingsFeaturesAndPreset: getSettingsFeaturesAndPresetMock,
    },
  },
}));

const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);

const membership = {
  id: 'm-1',
  userId: 'user-1',
  tenantId: MOCK_TENANT_ID,
  role: MEMBERSHIP_ROLE.OWNER,
};

const setup = customRenderAsync(DashboardFeaturesPage, {});

describe(`<${DashboardFeaturesPage.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset();
    listMembershipsWithTenantsForUserMock.mockReset();
    getAdminByUserIdMock.mockReset();
    getSettingsFeaturesAndPresetMock.mockReset();

    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getAdminByUserIdMock.mockResolvedValue(undefined);
    listMembershipsWithTenantsForUserMock.mockResolvedValue([
      { membership, tenant: { id: MOCK_TENANT_ID, plan: TENANT_PLAN.FREE } },
    ]);
  });

  it('redirects to sign-in without a session', async () => {
    authMock.mockResolvedValue(null);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(redirect).toHaveBeenCalledWith('/api/auth/signin?callbackUrl=%2F');
    expect(getSettingsFeaturesAndPresetMock).not.toHaveBeenCalled();
  });

  it("renders the resolved tenant's Features form", async () => {
    getSettingsFeaturesAndPresetMock.mockResolvedValue({
      features: undefined,
      preset: undefined,
    });

    await setup();

    expect(getSettingsFeaturesAndPresetMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
    );
    expect(screen.getByRole('heading', { name: 'Features' })).toBeVisible();
  });
});
