import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { makeTenant } from '@platform/testing/tenants/fixtures';
import { redirect } from 'next/navigation';

import TenantStudioPage from './page';

const {
  authMock,
  getAdminByUserIdMock,
  getTenantByIdMock,
  getTenantSanityCredentialsMock,
  studioMountMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  getAdminByUserIdMock: vi.fn(),
  getTenantByIdMock: vi.fn(),
  getTenantSanityCredentialsMock: vi.fn(),
  studioMountMock: vi.fn(),
}));

vi.mock('@platform/server/auth/auth', () => ({ auth: authMock }));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    admins: { getAdminByUserId: getAdminByUserIdMock },
    tenants: {
      getTenantById: getTenantByIdMock,
      getTenantSanityCredentials: getTenantSanityCredentialsMock,
    },
  },
}));

vi.mock('@blog/studio', () => ({
  StudioMount: (props: unknown) => {
    studioMountMock(props);
    return <div data-testid="studio-mount" />;
  },
}));

const setup = customRenderAsync(TenantStudioPage, {
  params: Promise.resolve({ tenantId: 'tenant-2' }),
});

describe(`<${TenantStudioPage.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset();
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getAdminByUserIdMock.mockReset();
    getAdminByUserIdMock.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });
    getTenantByIdMock.mockReset();
    getTenantSanityCredentialsMock.mockReset();
    studioMountMock.mockClear();
    vi.mocked(redirect).mockClear();
  });

  it('redirects to sign-in without querying the tenant when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');
    expect(getTenantByIdMock).not.toHaveBeenCalled();
  });

  it("404s a signed-in tenant owner with no admins row — editing the URL to another tenant's id never reaches its Studio, even calling the page directly", async () => {
    getAdminByUserIdMock.mockResolvedValue(undefined);

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(getTenantByIdMock).not.toHaveBeenCalled();
    expect(getTenantSanityCredentialsMock).not.toHaveBeenCalled();
  });

  it('404s for an unknown tenant id', async () => {
    getTenantByIdMock.mockResolvedValue(undefined);

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('shows the "Studio" heading and the archived notice instead of mounting Studio for an archived tenant, without checking credentials', async () => {
    getTenantByIdMock.mockResolvedValue(
      makeTenant({
        id: 'tenant-2',
        deprovisionedAt: new Date('2026-08-26T00:00:00.000Z'),
      }),
    );

    await setup();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Studio' }),
    ).toBeVisible();
    expect(screen.getByText('This tenant is archived')).toBeVisible();
    expect(getTenantSanityCredentialsMock).not.toHaveBeenCalled();
    expect(screen.queryByTestId('studio-mount')).not.toBeInTheDocument();
  });

  it("shows a not-ready alert instead of mounting Studio when the tenant's Sanity project isn't provisioned", async () => {
    getTenantByIdMock.mockResolvedValue(makeTenant({ id: 'tenant-2' }));
    getTenantSanityCredentialsMock.mockResolvedValue(undefined);

    await setup();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Studio' }),
    ).toBeVisible();
    expect(screen.getByText("Studio isn't ready yet")).toBeVisible();
    expect(screen.queryByTestId('studio-mount')).not.toBeInTheDocument();
  });

  it("mounts Studio for an operator with the routed tenant's own coordinates and a locale-free basePath keyed by that tenant id", async () => {
    getTenantByIdMock.mockResolvedValue(
      makeTenant({
        id: 'tenant-2',
        name: 'Globex Corp.',
        deprovisionedAt: null,
      }),
    );
    getTenantSanityCredentialsMock.mockResolvedValue({
      projectId: 'proj-globex',
      dataset: 'production',
      token: 'secret-token',
    });

    await setup();

    expect(getTenantSanityCredentialsMock).toHaveBeenCalledWith('tenant-2');
    expect(screen.getByTestId('studio-mount')).toBeVisible();
    expect(studioMountMock).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'proj-globex',
        dataset: 'production',
        basePath: '/tenants/tenant-2/studio',
        title: 'Globex Corp.',
      }),
    );
  });
});
