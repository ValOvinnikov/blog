import { auth } from '@platform/server/auth/auth';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';

import TenantDetailLayout from './layout';

const {
  getAdminByUserIdMock,
  getTenantByIdMock,
  resolveIsSidebarCollapsedMock,
} = vi.hoisted(() => ({
  getAdminByUserIdMock: vi.fn(),
  getTenantByIdMock: vi.fn(),
  resolveIsSidebarCollapsedMock: vi.fn(),
}));

vi.mock('@platform/server/auth/auth');

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

const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);

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
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getAdminByUserIdMock.mockResolvedValue({
      id: 'admin-1',
      userId: 'user-1',
      role: 'ADMIN',
      createdAt: new Date(),
    });
    getTenantByIdMock.mockResolvedValue({
      id: 'tenant-1',
      name: 'Acme Inc.',
      primaryDomain: 'acme.example.com',
    });
  });

  it('redirects to sign-in when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/api/auth/signin');
  });

  it('404s when the signed-in user has no admins row', async () => {
    getAdminByUserIdMock.mockResolvedValue(undefined);

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(redirect).not.toHaveBeenCalled();
  });

  it('renders the gated content for a platform operator', async () => {
    await setup();

    expect(screen.getByText('tenant content')).toBeVisible();
    expect(redirect).not.toHaveBeenCalled();
  });

  it('renders both the Platform and Tenant sections in the sidebar', async () => {
    await setup();

    expect(screen.getByText('Platform', { selector: 'p' })).toBeVisible();
    expect(screen.getByText('Tenant · Acme Inc.')).toBeVisible();
  });

  it('renders no tenant switcher in the sidebar', async () => {
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
