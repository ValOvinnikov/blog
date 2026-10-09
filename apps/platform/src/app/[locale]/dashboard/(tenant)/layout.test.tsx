import { auth } from '@platform/server/auth/auth';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';

import DashboardTenantLayout from './layout';

const {
  listMembershipsForUserMock,
  listTenantsByIdsMock,
  listTenantsMock,
  getAdminByUserIdMock,
  cookiesMock,
  resolveIsSidebarCollapsedMock,
} = vi.hoisted(() => ({
  listMembershipsForUserMock: vi.fn(),
  listTenantsByIdsMock: vi.fn(),
  listTenantsMock: vi.fn(),
  getAdminByUserIdMock: vi.fn(),
  cookiesMock: vi.fn(),
  resolveIsSidebarCollapsedMock: vi.fn(),
}));

vi.mock('@platform/server/auth/auth');

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

const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);

const tenant1 = {
  id: 'tenant-1',
  name: 'Acme Inc.',
  primaryDomain: 'acme.com',
  plan: 'FREE',
};
const tenant2 = {
  id: 'tenant-2',
  name: 'Globex Corp.',
  primaryDomain: 'globex.com',
  plan: 'GROWTH',
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
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    listMembershipsForUserMock.mockResolvedValue([membership1, membership2]);
    listTenantsByIdsMock.mockResolvedValue([tenant1, tenant2]);
    mockCookie('tenant-2');
  });

  it('redirects to sign-in without querying memberships when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/api/auth/signin');
    expect(listMembershipsForUserMock).not.toHaveBeenCalled();
  });

  it('redirects to /workspace-pending when the signed-in user has zero memberships', async () => {
    listMembershipsForUserMock.mockResolvedValue([]);

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/workspace-pending');
  });

  it('redirects to the picker for several memberships and no active-tenant cookie', async () => {
    mockCookie(undefined);

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/dashboard/select-tenant');
  });

  it('renders the active tenant and a switcher for several memberships with the cookie', async () => {
    await setup();

    expect(screen.getByText('dashboard content')).toBeVisible();
    expect(screen.getByRole('button', { name: /globex/i })).toBeVisible();
  });

  describe('with one membership', () => {
    beforeEach(() => {
      listMembershipsForUserMock.mockResolvedValue([membership1]);
      listTenantsByIdsMock.mockResolvedValue([tenant1]);
    });

    it('renders the gated content with no switcher for a user with one membership', async () => {
      await setup();

      expect(screen.getByText('dashboard content')).toBeVisible();
      expect(redirect).not.toHaveBeenCalled();
      expect(
        screen.queryByRole('button', { name: /acme/i }),
      ).not.toBeInTheDocument();
    });

    it('shows Tenant nav destinations under /dashboard, without a Platform section', async () => {
      await setup();

      expect(screen.getByRole('link', { name: /look/i })).toHaveAttribute(
        'href',
        '/dashboard/look',
      );
      expect(screen.queryByText('Platform')).not.toBeInTheDocument();
    });
  });

  it('hides Languages and Team from a FREE tenant', async () => {
    mockCookie('tenant-1');

    await setup();

    expect(
      screen.queryByRole('link', { name: /languages/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Team')).not.toBeInTheDocument();
  });

  it('shows Languages as a link and Team as "Coming soon" to a GROWTH tenant', async () => {
    await setup();

    expect(screen.getByRole('link', { name: /languages/i })).toHaveAttribute(
      'href',
      '/dashboard/languages',
    );
    expect(screen.getByText('Team')).toBeVisible();
    expect(
      screen.queryByRole('link', { name: /team/i }),
    ).not.toBeInTheDocument();
  });

  it('shows the platform role, never OWNER, for a SUPERADMIN with no memberships row', async () => {
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
    expect(screen.getByText('Super admin · Platform')).toBeVisible();
    expect(screen.queryByText(/Owner/)).not.toBeInTheDocument();
  });
});
