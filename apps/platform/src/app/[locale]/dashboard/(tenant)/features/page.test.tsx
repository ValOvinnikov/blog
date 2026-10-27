import { NEXT_NAVIGATION_ERROR, type TMaybeNull } from '@blog/config';
import en from '@platform/i18n/messages/en.json';
import { auth } from '@platform/server/auth/auth';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockMembershipWithTenant } from '@platform/testing/memberships/membership-with-tenant';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { mockUnsavedSettingsFeaturesAndPreset } from '@platform/testing/settings-features/fixtures';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';

import DashboardFeaturesPage from './page';

const {
  listMembershipsWithTenantsForUserMock,
  getSettingsFeaturesAndPresetMock,
} = vi.hoisted(() => ({
  listMembershipsWithTenantsForUserMock: vi.fn(),
  getSettingsFeaturesAndPresetMock: vi.fn(),
}));

vi.mock('@platform/server/auth/auth');

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    memberships: {
      listMembershipsWithTenantsForUser: listMembershipsWithTenantsForUserMock,
    },
    admins: { getAdminByUserId: vi.fn() },
    settingsFeatures: {
      getSettingsFeaturesAndPreset: getSettingsFeaturesAndPresetMock,
    },
  },
}));

const authMock = vi.mocked<() => Promise<TMaybeNull<Partial<Session>>>>(auth);

const setup = customRenderAsync(DashboardFeaturesPage, {});

describe(`<${DashboardFeaturesPage.name}/>`, () => {
  beforeEach(() => {
    listMembershipsWithTenantsForUserMock.mockResolvedValue([
      mockMembershipWithTenant(),
    ]);
    getSettingsFeaturesAndPresetMock.mockResolvedValue(
      mockUnsavedSettingsFeaturesAndPreset(),
    );
  });

  it('redirects a signed-out visitor to sign-in', async () => {
    authMock.mockResolvedValueOnce(null);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(redirect).toHaveBeenCalledWith(adminRoutes.signIn());
    expect(getSettingsFeaturesAndPresetMock).not.toHaveBeenCalled();
  });

  it("renders the session tenant's Features settings", async () => {
    await setup();

    const heading = screen.getByRole('heading', {
      name: en.featuresSettings.heading,
    });

    expect(heading).toBeVisible();
    expect(getSettingsFeaturesAndPresetMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
    );
  });
});
