import {
  NEXT_NAVIGATION_ERROR,
  SANITY_LOGIN_PROVIDER,
  type TMaybeNull,
} from '@blog/config';
import type { TTenant } from '@blog/db/schema/tenants';
import { faker } from '@faker-js/faker';
import en from '@platform/i18n/messages/en.json';
import { auth } from '@platform/server/auth/auth';
import { resolveHasEnteredStudio } from '@platform/server/studio-entry/resolve-has-entered-studio';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockMembershipWithTenant } from '@platform/testing/memberships/membership-with-tenant';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import {
  MOCK_OWNER_INVITED_AT,
  MOCK_OWNER_JOINED_AT,
  MOCK_SANITY_PROJECT_ID,
  MOCK_TENANT_NAME,
} from '@platform/testing/tenants/fixtures';
import {
  MOCK_FREE_STUDIO_ENTITLEMENTS,
  mockStudioReadyTenant,
} from '@platform/testing/tenants/studio-ready-tenant';
import { adminRoutes } from '@platform/utils/routes/routes';
import { studioEnteredCookie } from '@platform/utils/studio-entered-cookie/studio-entered-cookie';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';

import DashboardStudioPage from './page';

faker.seed(5996);

const {
  listMembershipsWithTenantsForUserMock,
  studioMountMock,
  STUDIO_MOUNT_TEST_ID,
} = vi.hoisted(() => ({
  listMembershipsWithTenantsForUserMock: vi.fn(),
  studioMountMock: vi.fn(),
  STUDIO_MOUNT_TEST_ID: 'studio-mount',
}));

vi.mock('@platform/server/auth/auth');

vi.mock('@platform/server/settings-features/get-enabled-capabilities');

vi.mock('@platform/server/studio-entry/resolve-has-entered-studio');

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    memberships: {
      listMembershipsWithTenantsForUser: listMembershipsWithTenantsForUserMock,
    },
    tenants: {
      selectLiveLocales: vi.fn(() => []),
    },
    admins: { getAdminByUserId: vi.fn() },
  },
}));

vi.mock('@blog/studio', () => ({
  StudioMount: (props: unknown) => {
    studioMountMock(props);
    return <div data-testid={STUDIO_MOUNT_TEST_ID} />;
  },
}));

const MOCK_OWNER_SANITY_USER_ID = faker.string.uuid();

const authMock = vi.mocked<() => Promise<TMaybeNull<Partial<Session>>>>(auth);

const setup = customRenderAsync(DashboardStudioPage, {});

const MOCK_READY_OWNER_ACCESS: Partial<TTenant> = {
  ownerInviteSentAt: MOCK_OWNER_INVITED_AT,
  ownerInviteAcceptedAt: MOCK_OWNER_JOINED_AT,
  ownerSanityUserId: MOCK_OWNER_SANITY_USER_ID,
  ownerLoginProvider: SANITY_LOGIN_PROVIDER.GOOGLE,
};

const renderForTenant = async (overrides: Partial<TTenant> = {}) => {
  const tenant = mockStudioReadyTenant(overrides);
  listMembershipsWithTenantsForUserMock.mockResolvedValue([
    mockMembershipWithTenant(tenant),
  ]);
  await setup();

  return tenant;
};

describe(`<${DashboardStudioPage.name}/>`, () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: MOCK_OWNER_INVITED_AT, toFake: ['Date'] });
    vi.mocked(resolveHasEnteredStudio).mockResolvedValue(false);
  });

  afterEach(() => {
    vi.useRealTimers();
    studioMountMock.mockClear();
  });

  it('redirects a signed-out visitor to sign-in without resolving a tenant', async () => {
    authMock.mockResolvedValueOnce(null);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(redirect).toHaveBeenCalledWith(adminRoutes.signIn());
    expect(listMembershipsWithTenantsForUserMock).not.toHaveBeenCalled();
  });

  it("mounts Studio for the session tenant under the dashboard's Studio path", async () => {
    const tenant = await renderForTenant();

    const studioMount = screen.getByTestId(STUDIO_MOUNT_TEST_ID);

    expect(studioMount).toBeVisible();
    expect(studioMountMock).toHaveBeenCalledWith({
      projectId: MOCK_SANITY_PROJECT_ID,
      dataset: tenant.sanityDataset,
      basePath: adminRoutes.dashboardStudio(),
      title: MOCK_TENANT_NAME,
      enabledCapabilities: [],
      entitlements: MOCK_FREE_STUDIO_ENTITLEMENTS,
      defaultLocale: tenant.locale,
      liveLocales: [],
      loginProvider: undefined,
    });
  });

  it("explains the owner's pending Studio access and leaves Studio unmounted", async () => {
    await renderForTenant({ ownerInviteSentAt: MOCK_OWNER_INVITED_AT });

    const explainerTitle = screen.getByText(
      en.ownerStudioAccess.title.INVITE_SENT,
    );
    const studioMount = screen.queryByTestId(STUDIO_MOUNT_TEST_ID);

    expect(explainerTitle).toBeVisible();
    expect(studioMount).not.toBeInTheDocument();
  });

  it("opens Studio on the owner's login provider once their access is ready", async () => {
    const tenant = await renderForTenant(MOCK_READY_OWNER_ACCESS);

    const studioMount = screen.getByTestId(STUDIO_MOUNT_TEST_ID);

    expect(studioMount).toBeVisible();
    expect(studioMountMock).toHaveBeenCalledWith({
      projectId: MOCK_SANITY_PROJECT_ID,
      dataset: tenant.sanityDataset,
      basePath: adminRoutes.dashboardStudio(),
      title: MOCK_TENANT_NAME,
      enabledCapabilities: [],
      entitlements: MOCK_FREE_STUDIO_ENTITLEMENTS,
      defaultLocale: tenant.locale,
      liveLocales: [],
      loginProvider: SANITY_LOGIN_PROVIDER.GOOGLE,
      onSignedIn: expect.any(Function),
    });
  });

  it("records the owner's first Studio entry for this tenant and refreshes the shell", async () => {
    const refresh = mockRouterRefresh();
    const tenant = await renderForTenant(MOCK_READY_OWNER_ACCESS);
    studioMountMock.mock.lastCall?.[0]?.onSignedIn();

    expect(document.cookie).toContain(studioEnteredCookie(tenant.id));
    expect(refresh).toHaveBeenCalledOnce();
  });

  it('stops listening for a sign-in once the owner has entered the Studio in this browser', async () => {
    vi.mocked(resolveHasEnteredStudio).mockResolvedValue(true);

    await renderForTenant(MOCK_READY_OWNER_ACCESS);

    expect(studioMountMock).toHaveBeenCalledWith(
      expect.objectContaining({ onSignedIn: undefined }),
    );
  });
});
