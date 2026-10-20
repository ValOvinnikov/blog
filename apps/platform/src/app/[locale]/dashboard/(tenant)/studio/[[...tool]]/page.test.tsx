import type { TMaybeNull } from '@blog/config';
import { auth } from '@platform/server/auth/auth';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { makeTenant } from '@platform/testing/tenants/fixtures';
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

const membership = {
  id: 'm-1',
  userId: 'user-1',
  tenantId: 'tenant-1',
  role: 'OWNER',
};

const setup = customRenderAsync(DashboardStudioPage, {});

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

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/api/auth/signin?callbackUrl=%2F');
    expect(listMembershipsWithTenantsForUserMock).not.toHaveBeenCalled();
  });

  it("mounts Studio with the session tenant's coordinates and a locale-free basePath", async () => {
    listMembershipsWithTenantsForUserMock.mockResolvedValue([
      {
        membership,
        tenant: makeTenant({
          id: 'tenant-1',
          name: 'Acme Inc.',
          sanityProjectId: 'proj-acme',
          sanityDataset: 'production',
          sanityReadTokenEncrypted: 'encrypted-token',
        }),
      },
    ]);

    await setup();

    const studioMount = screen.getByTestId('studio-mount');

    expect(studioMount).toBeVisible();
    expect(studioMountMock).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'proj-acme',
        dataset: 'production',
        basePath: '/dashboard/studio',
        title: 'Acme Inc.',
      }),
    );
  });

  it("explains the owner's pending Studio access instead of mounting Studio", async () => {
    listMembershipsWithTenantsForUserMock.mockResolvedValue([
      {
        membership,
        tenant: makeTenant({
          id: 'tenant-1',
          sanityProjectId: 'proj-acme',
          sanityDataset: 'production',
          sanityReadTokenEncrypted: 'encrypted-token',
          ownerInviteSentAt: new Date('2026-10-18T09:00:00.000Z'),
        }),
      },
    ]);

    await setup();

    const acceptYourStudioText = screen.getByText('Accept your Studio invite');

    expect(acceptYourStudioText).toBeVisible();
    const checkNowButton = screen.getByRole('button', { name: 'Check now' });

    expect(checkNowButton).toBeVisible();
    const resendInviteButton = screen.getByRole('button', {
      name: 'Resend invite',
    });

    expect(resendInviteButton).toBeVisible();
    const studioMount = screen.queryByTestId('studio-mount');

    expect(studioMount).not.toBeInTheDocument();
  });

  it("opens Studio straight into the owner's login provider once their access is ready", async () => {
    listMembershipsWithTenantsForUserMock.mockResolvedValue([
      {
        membership,
        tenant: makeTenant({
          id: 'tenant-1',
          sanityProjectId: 'proj-acme',
          sanityDataset: 'production',
          sanityReadTokenEncrypted: 'encrypted-token',
          ownerInviteSentAt: new Date('2026-10-18T09:00:00.000Z'),
          ownerInviteAcceptedAt: new Date('2026-10-18T10:00:00.000Z'),
          ownerSanityUserId: 'sanity-user-1',
          ownerSanityRole: 'ADMINISTRATOR',
          ownerLoginProvider: 'GOOGLE',
        }),
      },
    ]);

    await setup();

    const studioMount = screen.getByTestId('studio-mount');

    expect(studioMount).toBeVisible();
    expect(studioMountMock).toHaveBeenCalledWith(
      expect.objectContaining({ loginProvider: 'GOOGLE' }),
    );
  });
});
