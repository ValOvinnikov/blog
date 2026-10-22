import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import { ADMIN_ROLE } from '@blog/db/constants';
import { auth } from '@platform/server/auth/auth';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { TENANT_ID } from '@platform/testing/tenants/fixtures';
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
  params: Promise.resolve({ tenantId: TENANT_ID }),
  children: <div>tenant content</div>,
});

const ACME_EXAMPLE_COM = 'acme.example.com';

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
      role: ADMIN_ROLE.ADMIN,
      createdAt: new Date(),
    });
    getTenantByIdMock.mockResolvedValue({
      id: TENANT_ID,
      name: 'Acme Inc.',
      primaryDomain: ACME_EXAMPLE_COM,
    });
  });

  it('redirects to sign-in when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(redirect).toHaveBeenCalledWith('/api/auth/signin?callbackUrl=%2F');
  });

  it('404s when the signed-in user has no admins row', async () => {
    getAdminByUserIdMock.mockResolvedValue(undefined);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

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
      id: TENANT_ID,
      slug: 'acme',
      name: 'Acme Inc.',
      primaryDomain: ACME_EXAMPLE_COM,
    });

    await setup();

    expect(screen.queryByText(ACME_EXAMPLE_COM)).not.toBeInTheDocument();
  });
});
