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

vi.mock('@platform/server/settings-features/get-enabled-capabilities', () => ({
  getEnabledCapabilities: vi.fn().mockResolvedValue([]),
}));

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

const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);

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

    expect(redirect).toHaveBeenCalledWith('/api/auth/signin');
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

    expect(screen.getByTestId('studio-mount')).toBeVisible();
    expect(studioMountMock).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'proj-acme',
        dataset: 'production',
        basePath: '/dashboard/studio',
        title: 'Acme Inc.',
      }),
    );
  });
});
