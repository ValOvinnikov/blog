import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { makeTenant } from '@platform/testing/tenants/fixtures';
import { redirect } from 'next/navigation';

import DashboardStudioPage from './page';

const {
  authMock,
  listMembershipsForUserMock,
  listTenantsByIdsMock,
  getAdminByUserIdMock,
  getTenantSanityCredentialsMock,
  studioMountMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  listMembershipsForUserMock: vi.fn(),
  listTenantsByIdsMock: vi.fn(),
  getAdminByUserIdMock: vi.fn(),
  getTenantSanityCredentialsMock: vi.fn(),
  studioMountMock: vi.fn(),
}));

vi.mock('@platform/server/auth/auth', () => ({ auth: authMock }));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    memberships: { listMembershipsForUser: listMembershipsForUserMock },
    tenants: {
      listTenantsByIds: listTenantsByIdsMock,
      getTenantSanityCredentials: getTenantSanityCredentialsMock,
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

const setup = customRenderAsync(DashboardStudioPage, {});

describe(`<${DashboardStudioPage.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset();
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    listMembershipsForUserMock.mockReset();
    listMembershipsForUserMock.mockResolvedValue([
      { id: 'm-1', userId: 'user-1', tenantId: 'tenant-1', role: 'OWNER' },
    ]);
    listTenantsByIdsMock.mockReset();
    getAdminByUserIdMock.mockReset();
    getAdminByUserIdMock.mockResolvedValue(undefined);
    getTenantSanityCredentialsMock.mockReset();
    studioMountMock.mockClear();
    vi.mocked(redirect).mockClear();
  });

  it('redirects to sign-in without resolving credentials when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/api/auth/signin');
    expect(getTenantSanityCredentialsMock).not.toHaveBeenCalled();
  });

  it("shows a not-ready alert instead of mounting Studio when the tenant's Sanity project isn't provisioned", async () => {
    listTenantsByIdsMock.mockResolvedValue([makeTenant({ id: 'tenant-1' })]);
    getTenantSanityCredentialsMock.mockResolvedValue(undefined);

    await setup();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Studio' }),
    ).toBeVisible();
    expect(screen.getByText("Studio isn't ready yet")).toBeVisible();
    expect(screen.queryByTestId('studio-mount')).not.toBeInTheDocument();
  });

  it('shows the archived notice instead of mounting Studio for an archived tenant, without checking credentials', async () => {
    listTenantsByIdsMock.mockResolvedValue([
      makeTenant({
        id: 'tenant-1',
        deprovisionedAt: new Date('2026-08-26T00:00:00.000Z'),
      }),
    ]);

    await setup();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Studio' }),
    ).toBeVisible();
    expect(screen.getByText('This tenant is archived')).toBeVisible();
    expect(getTenantSanityCredentialsMock).not.toHaveBeenCalled();
    expect(screen.queryByTestId('studio-mount')).not.toBeInTheDocument();
  });

  it("mounts Studio with the session tenant's own coordinates and a locale-free basePath — never a tenant id from the URL, since this route carries none", async () => {
    listTenantsByIdsMock.mockResolvedValue([
      makeTenant({ id: 'tenant-1', name: 'Acme Inc.' }),
    ]);
    getTenantSanityCredentialsMock.mockResolvedValue({
      projectId: 'proj-acme',
      dataset: 'production',
      token: 'secret-token',
    });

    await setup();

    expect(getTenantSanityCredentialsMock).toHaveBeenCalledWith('tenant-1');
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
