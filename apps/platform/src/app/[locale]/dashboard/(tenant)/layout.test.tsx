import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { redirect } from 'next/navigation';

import DashboardTenantLayout from './layout';

const {
  authMock,
  listMembershipsForUserMock,
  listTenantsByIdsMock,
  listTenantsMock,
  getAdminByUserIdMock,
  cookiesMock,
  resolveIsSidebarCollapsedMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  listMembershipsForUserMock: vi.fn(),
  listTenantsByIdsMock: vi.fn(),
  listTenantsMock: vi.fn(),
  getAdminByUserIdMock: vi.fn(),
  cookiesMock: vi.fn(),
  resolveIsSidebarCollapsedMock: vi.fn(),
}));

vi.mock('@platform/server/auth/auth', () => ({ auth: authMock }));

vi.mock('@platform/server/layout/resolve-is-sidebar-collapsed', () => ({
  resolveIsSidebarCollapsed: resolveIsSidebarCollapsedMock,
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    memberships: { listMembershipsForUser: listMembershipsForUserMock },
    tenants: {
      listTenantsByIds: listTenantsByIdsMock,
      listTenants: listTenantsMock,
    },
    admins: { getAdminByUserId: getAdminByUserIdMock },
  },
}));

vi.mock('next/headers', () => ({ cookies: cookiesMock }));

const tenant1 = {
  id: 'tenant-1',
  slug: 'acme',
  name: 'Acme Inc.',
  primaryDomain: 'acme.com',
};
const tenant2 = {
  id: 'tenant-2',
  slug: 'globex',
  name: 'Globex Corp.',
  primaryDomain: 'globex.com',
};
const membership1 = {
  id: 'm-1',
  userId: 'user-1',
  tenantId: 'tenant-1',
  role: 'OWNER',
};
const membership2 = {
  id: 'm-2',
  userId: 'user-1',
  tenantId: 'tenant-2',
  role: 'OWNER',
};

const mockCookie = (value: string | undefined) => {
  cookiesMock.mockResolvedValue({
    get: vi.fn(() => (value === undefined ? undefined : { value })),
  });
};

const setup = customRenderAsync(DashboardTenantLayout, {
  children: <div>dashboard content</div>,
});

describe(`<${DashboardTenantLayout.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset();
    listMembershipsForUserMock.mockReset();
    listTenantsByIdsMock.mockReset();
    listTenantsMock.mockReset();
    getAdminByUserIdMock.mockReset();
    getAdminByUserIdMock.mockResolvedValue(undefined);
    cookiesMock.mockReset();
    resolveIsSidebarCollapsedMock.mockReset();
    resolveIsSidebarCollapsedMock.mockResolvedValue(false);
    vi.mocked(redirect).mockClear();
  });

  it('redirects to sign-in without querying memberships when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/api/auth/signin');
    expect(listMembershipsForUserMock).not.toHaveBeenCalled();
  });

  it('redirects to /workspace-pending when the signed-in user has zero memberships', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    listMembershipsForUserMock.mockResolvedValue([]);

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/workspace-pending');
  });

  it('renders the gated content directly for a user with exactly one membership, with no switcher', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    listMembershipsForUserMock.mockResolvedValue([membership1]);
    listTenantsByIdsMock.mockResolvedValue([tenant1]);

    await setup();

    expect(screen.getByText('dashboard content')).toBeVisible();
    expect(redirect).not.toHaveBeenCalled();
    expect(
      screen.queryByRole('button', { name: /acme/i }),
    ).not.toBeInTheDocument();
  });

  it('redirects to the picker for a user with multiple memberships and no active-tenant cookie', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    listMembershipsForUserMock.mockResolvedValue([membership1, membership2]);
    listTenantsByIdsMock.mockResolvedValue([tenant1, tenant2]);
    mockCookie(undefined);

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/dashboard/select-tenant');
  });

  it('renders the active tenant and a switcher for a user with multiple memberships once the cookie is set', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    listMembershipsForUserMock.mockResolvedValue([membership1, membership2]);
    listTenantsByIdsMock.mockResolvedValue([tenant1, tenant2]);
    mockCookie('tenant-2');

    await setup();

    expect(screen.getByText('dashboard content')).toBeVisible();
    expect(screen.getByRole('button', { name: /globex/i })).toBeVisible();
  });

  it('shows the Tenant nav destinations under slug-free /dashboard hrefs, without a Platform section', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    listMembershipsForUserMock.mockResolvedValue([membership1]);
    listTenantsByIdsMock.mockResolvedValue([tenant1]);

    await setup();

    expect(screen.getByRole('link', { name: /look/i })).toHaveAttribute(
      'href',
      '/dashboard/look',
    );
    expect(screen.queryByText('Platform')).not.toBeInTheDocument();
  });

  it('shows the real platform role, never OWNER, for a SUPERADMIN with no real memberships row', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getAdminByUserIdMock.mockResolvedValue({
      id: 'admin-1',
      userId: 'user-1',
      role: 'SUPERADMIN',
      createdAt: new Date(),
    });
    listTenantsMock.mockResolvedValue([tenant1]);

    await setup();

    expect(screen.getByText('dashboard content')).toBeVisible();
    expect(listMembershipsForUserMock).not.toHaveBeenCalled();
    expect(screen.getByText('SUPERADMIN')).toBeVisible();
    expect(screen.queryByText('OWNER')).not.toBeInTheDocument();
    expect(screen.getByText('· Platform')).toBeVisible();
  });
});
