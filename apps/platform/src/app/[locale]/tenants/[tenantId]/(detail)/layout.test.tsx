import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { redirect } from 'next/navigation';

import TenantDetailLayout from './layout';

const {
  authMock,
  getAdminByUserIdMock,
  getTenantByIdMock,
  resolveIsSidebarCollapsedMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  getAdminByUserIdMock: vi.fn(),
  getTenantByIdMock: vi.fn(),
  resolveIsSidebarCollapsedMock: vi.fn(),
}));

vi.mock('@platform/server/auth/auth', () => ({ auth: authMock }));

vi.mock('@platform/server/layout/resolve-is-sidebar-collapsed', () => ({
  resolveIsSidebarCollapsed: resolveIsSidebarCollapsedMock,
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    admins: { getAdminByUserId: getAdminByUserIdMock },
    tenants: { getTenantById: getTenantByIdMock },
  },
}));

const setup = customRenderAsync(TenantDetailLayout, {
  params: Promise.resolve({ tenantId: 'tenant-1' }),
  children: <div>tenant content</div>,
});

describe(`<${TenantDetailLayout.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset();
    getAdminByUserIdMock.mockReset();
    getTenantByIdMock.mockReset();
    resolveIsSidebarCollapsedMock.mockReset();
    resolveIsSidebarCollapsedMock.mockResolvedValue(false);
    vi.mocked(redirect).mockClear();
  });

  it('redirects to sign-in without querying the tenant when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/api/auth/signin');
    expect(getTenantByIdMock).not.toHaveBeenCalled();
  });

  it('404s when the signed-in user has no admins row', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getAdminByUserIdMock.mockResolvedValue(undefined);

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(redirect).not.toHaveBeenCalled();
    expect(getTenantByIdMock).not.toHaveBeenCalled();
  });

  it('renders the gated content for a platform operator', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getAdminByUserIdMock.mockResolvedValue({
      id: 'admin-1',
      userId: 'user-1',
      role: 'ADMIN',
      createdAt: new Date(),
    });
    getTenantByIdMock.mockResolvedValue({
      id: 'tenant-1',
      slug: 'acme',
      name: 'Acme Inc.',
      primaryDomain: 'acme.example.com',
    });

    await setup();

    expect(screen.getByText('tenant content')).toBeVisible();
    expect(redirect).not.toHaveBeenCalled();
  });

  it('renders both the Platform and Tenant sections in the sidebar', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getAdminByUserIdMock.mockResolvedValue({
      id: 'admin-1',
      userId: 'user-1',
      role: 'ADMIN',
      createdAt: new Date(),
    });
    getTenantByIdMock.mockResolvedValue({
      id: 'tenant-1',
      slug: 'acme',
      name: 'Acme Inc.',
      primaryDomain: 'acme.example.com',
    });

    await setup();

    expect(screen.getByText('Platform', { selector: 'p' })).toBeVisible();
    expect(screen.getByText('Tenant · Acme Inc.')).toBeVisible();
  });

  it('renders no tenant switcher in the sidebar', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getAdminByUserIdMock.mockResolvedValue({
      id: 'admin-1',
      userId: 'user-1',
      role: 'ADMIN',
      createdAt: new Date(),
    });
    getTenantByIdMock.mockResolvedValue({
      id: 'tenant-1',
      slug: 'acme',
      name: 'Acme Inc.',
      primaryDomain: 'acme.example.com',
    });

    await setup();

    expect(screen.queryByText('acme.example.com')).not.toBeInTheDocument();
  });
});
