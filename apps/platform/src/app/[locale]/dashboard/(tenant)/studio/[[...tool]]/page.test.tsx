import {
  SANITY_LOGIN_PROVIDER,
  type TMaybeNull,
  NEXT_NAVIGATION_ERROR,
} from '@blog/config';
import { SANITY_PROJECT_ROLE } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import { auth } from '@platform/server/auth/auth';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { makeMembership } from '@platform/testing/memberships/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { makeTenant } from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';

import DashboardStudioPage from './page';

const {
  listMembershipsWithTenantsForUserMock,
  getAdminByUserIdMock,
  studioMountMock,
} = vi.hoisted(() => ({
  listMembershipsWithTenantsForUserMock: vi.fn(),
  getAdminByUserIdMock: vi.fn(),
  studioMountMock: vi.fn(),
}));

vi.mock('@platform/server/auth/auth');

vi.mock('@platform/server/settings-features/get-enabled-capabilities');

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    memberships: {
      listMembershipsWithTenantsForUser: listMembershipsWithTenantsForUserMock,
    },
    tenants: {
      selectLiveLocales: vi.fn().mockReturnValue([]),
    },
    admins: { getAdminByUserId: getAdminByUserIdMock },
  },
}));

vi.mock('@blog/studio', () => ({
  StudioMount: (props: unknown) => {
    studioMountMock(props);
    return <div data-testid="studio-mount" />;
  },
}));

const authMock = vi.mocked<() => Promise<TMaybeNull<Partial<Session>>>>(auth);

const membership = makeMembership();

const setup = customRenderAsync(DashboardStudioPage, {});

const renderForTenant = async (overrides: Partial<TTenant> = {}) => {
  listMembershipsWithTenantsForUserMock.mockResolvedValue([
    {
      membership,
      tenant: makeTenant({
        id: 'tenant-1',
        name: 'Acme Inc.',
        sanityProjectId: 'proj-acme',
        sanityDataset: 'production',
        sanityReadTokenEncrypted: 'encrypted-token',
        ...overrides,
      }),
    },
  ]);
  await setup();
};

const STUDIO_MOUNT_TEST_ID = 'studio-mount';
const invitedAt = new Date();

describe(`<${DashboardStudioPage.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset();
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    listMembershipsWithTenantsForUserMock.mockReset();
    getAdminByUserIdMock.mockReset();
    getAdminByUserIdMock.mockResolvedValue(undefined);
  });

  it('redirects to sign-in without resolving the tenant when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(redirect).toHaveBeenCalledWith('/api/auth/signin?callbackUrl=%2F');
    expect(listMembershipsWithTenantsForUserMock).not.toHaveBeenCalled();
  });

  it("mounts Studio with the session tenant's coordinates and a locale-free basePath", async () => {
    await renderForTenant();

    const studioMount = screen.getByTestId(STUDIO_MOUNT_TEST_ID);

    expect(studioMount).toBeVisible();
    expect(studioMountMock).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'proj-acme',
        dataset: 'production',
        basePath: adminRoutes.dashboardStudio(),
        title: 'Acme Inc.',
      }),
    );
  });

  it("explains the owner's pending Studio access instead of mounting Studio", async () => {
    await renderForTenant({ ownerInviteSentAt: invitedAt });

    const explainerTitle = screen.getByText('Accept your Studio invite');
    const checkNowButton = screen.getByRole('button', { name: 'Check now' });
    const resendInviteButton = screen.getByRole('button', {
      name: 'Resend invite',
    });
    const studioMount = screen.queryByTestId(STUDIO_MOUNT_TEST_ID);

    expect(explainerTitle).toBeVisible();
    expect(checkNowButton).toBeVisible();
    expect(resendInviteButton).toBeVisible();
    expect(studioMount).not.toBeInTheDocument();
  });

  it("opens Studio straight into the owner's login provider once their access is ready", async () => {
    await renderForTenant({
      ownerInviteSentAt: invitedAt,
      ownerInviteAcceptedAt: new Date('2026-10-18T10:00:00.000Z'),
      ownerSanityUserId: 'sanity-user-1',
      ownerSanityRole: SANITY_PROJECT_ROLE.ADMINISTRATOR,
      ownerLoginProvider: SANITY_LOGIN_PROVIDER.GOOGLE,
    });

    const studioMount = screen.getByTestId(STUDIO_MOUNT_TEST_ID);

    expect(studioMount).toBeVisible();
    expect(studioMountMock).toHaveBeenCalledWith(
      expect.objectContaining({ loginProvider: SANITY_LOGIN_PROVIDER.GOOGLE }),
    );
  });
});
