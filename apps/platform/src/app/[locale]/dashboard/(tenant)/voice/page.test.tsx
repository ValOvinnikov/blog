import {
  LOCALE_ISO_CODES,
  NEXT_NAVIGATION_ERROR,
  type TMaybeNull,
} from '@blog/config';
import en from '@platform/i18n/messages/en.json';
import { auth } from '@platform/server/auth/auth';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockMembershipWithTenant } from '@platform/testing/memberships/membership-with-tenant';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';

import DashboardVoicePage from './page';

const { listMembershipsWithTenantsForUserMock, getSiteConfigMock } = vi.hoisted(
  () => ({
    listMembershipsWithTenantsForUserMock: vi.fn(),
    getSiteConfigMock: vi.fn(),
  }),
);

vi.mock('@platform/server/auth/auth');

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    memberships: {
      listMembershipsWithTenantsForUser: listMembershipsWithTenantsForUserMock,
    },
    tenants: {
      selectLiveLocales: vi.fn(() => [LOCALE_ISO_CODES.EN]),
    },
    admins: { getAdminByUserId: vi.fn() },
    siteConfig: { getSiteConfig: getSiteConfigMock },
  },
}));

const authMock = vi.mocked<() => Promise<TMaybeNull<Partial<Session>>>>(auth);

const setup = customRenderAsync(DashboardVoicePage, {});

describe(`<${DashboardVoicePage.name}/>`, () => {
  beforeEach(() => {
    listMembershipsWithTenantsForUserMock.mockResolvedValue([
      mockMembershipWithTenant(),
    ]);
  });

  it('redirects a signed-out visitor to sign-in', async () => {
    authMock.mockResolvedValueOnce(null);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(redirect).toHaveBeenCalledWith(adminRoutes.signIn());
    expect(getSiteConfigMock).not.toHaveBeenCalled();
  });

  it("renders the session tenant's Voice settings", async () => {
    await setup();

    const heading = screen.getByRole('heading', {
      name: en.voiceSettings.heading,
    });

    expect(heading).toBeVisible();
    expect(getSiteConfigMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
  });
});
