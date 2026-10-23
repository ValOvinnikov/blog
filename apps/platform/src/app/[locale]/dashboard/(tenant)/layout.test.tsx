import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import { TENANT_PLAN, MEMBERSHIP_ROLE, ADMIN_ROLE } from '@blog/db/constants';
import { auth } from '@platform/server/auth/auth';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import {
  MOCK_OTHER_TENANT_ID,
  MOCK_OTHER_TENANT_NAME,
  MOCK_TENANT_NAME,
  TENANT_ID,
} from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';

import DashboardTenantLayout from './layout';

const {
  listMembershipsWithTenantsForUserMock,
  listTenantsMock,
  getAdminByUserIdMock,
  listLeadsMock,
  cookiesMock,
  resolveIsSidebarCollapsedMock,
} = vi.hoisted(() => ({
  listMembershipsWithTenantsForUserMock: vi.fn(),
  listTenantsMock: vi.fn(),
  getAdminByUserIdMock: vi.fn(),
  listLeadsMock: vi.fn(),
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
    memberships: {
      listMembershipsWithTenantsForUser: listMembershipsWithTenantsForUserMock,
    },
    tenants: {
      listTenants: listTenantsMock,
    },
    admins: { getAdminByUserId: getAdminByUserIdMock },
    leads: { listLeads: listLeadsMock },
  },
}));

vi.mock('next/headers', () => ({
  cookies: cookiesMock,
  headers: async () => new Headers(),
}));

const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);

const tenant1 = {
  id: TENANT_ID,
  name: MOCK_TENANT_NAME,
  primaryDomain: 'acme.com',
  plan: TENANT_PLAN.FREE,
};
const tenant2 = {
  id: MOCK_OTHER_TENANT_ID,
  name: MOCK_OTHER_TENANT_NAME,
  primaryDomain: 'globex.com',
  plan: TENANT_PLAN.GROWTH,
};
const membership1 = {
  id: 'm-1',
  userId: 'user-1',
  tenantId: TENANT_ID,
  role: MEMBERSHIP_ROLE.OWNER,
};
const membership2 = {
  id: 'm-2',
  userId: 'user-1',
  tenantId: MOCK_OTHER_TENANT_ID,
  role: MEMBERSHIP_ROLE.OWNER,
};

const mockCookie = (value: string | undefined) => {
  cookiesMock.mockResolvedValue({
    get: vi.fn(() => (value === undefined ? undefined : { value })),
  });
};

const setup = customRenderAsync(DashboardTenantLayout, {
  children: <div>dashboard content</div>,
});

const DASHBOARD_CONTENT = 'dashboard content';
const LEADS = 'Leads';
const TEAM = 'Team';

describe(`<${DashboardTenantLayout.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset();
    listMembershipsWithTenantsForUserMock.mockReset();
    listTenantsMock.mockReset();
    getAdminByUserIdMock.mockReset();
    getAdminByUserIdMock.mockResolvedValue(undefined);
    listLeadsMock.mockReset();
    listLeadsMock.mockResolvedValue({ leads: [], total: 0 });
    cookiesMock.mockReset();
    resolveIsSidebarCollapsedMock.mockReset();
    resolveIsSidebarCollapsedMock.mockResolvedValue(false);
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    listMembershipsWithTenantsForUserMock.mockResolvedValue([
      { membership: membership1, tenant: tenant1 },
      { membership: membership2, tenant: tenant2 },
    ]);
    mockCookie(MOCK_OTHER_TENANT_ID);
  });

  it('offers Leads on a plan with the contact form', async () => {
    await setup();

    const leadsLink = screen.getByRole('link', { name: LEADS });

    expect(leadsLink).toHaveAttribute('href', adminRoutes.dashboardLeads());
  });

  it('hides Leads from a plan without the contact form and no stored leads', async () => {
    mockCookie(TENANT_ID);

    await setup();

    const leadsLink = screen.queryByRole('link', { name: LEADS });

    expect(leadsLink).not.toBeInTheDocument();
  });

  it('keeps Leads for a downgraded owner who still has stored leads', async () => {
    mockCookie(TENANT_ID);
    listLeadsMock.mockResolvedValue({ leads: [], total: 3 });

    await setup();

    const leadsLink = screen.getByRole('link', { name: LEADS });

    expect(leadsLink).toBeVisible();
  });

  it('hides Leads from an editor', async () => {
    listMembershipsWithTenantsForUserMock.mockResolvedValue([
      {
        membership: { ...membership2, role: MEMBERSHIP_ROLE.EDITOR },
        tenant: tenant2,
      },
    ]);

    await setup();

    const leadsLink = screen.queryByRole('link', { name: LEADS });

    expect(leadsLink).not.toBeInTheDocument();
  });

  it('redirects to sign-in without querying memberships when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(redirect).toHaveBeenCalledWith(adminRoutes.signIn());
    expect(listMembershipsWithTenantsForUserMock).not.toHaveBeenCalled();
  });

  it('redirects to /workspace-pending when the signed-in user has zero memberships', async () => {
    listMembershipsWithTenantsForUserMock.mockResolvedValue([]);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(redirect).toHaveBeenCalledWith(adminRoutes.workspacePending());
  });

  it('redirects to the picker for several memberships and no active-tenant cookie', async () => {
    mockCookie(undefined);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(redirect).toHaveBeenCalledWith(adminRoutes.dashboardSelectTenant());
  });

  it('renders the active tenant and a switcher for several memberships with the cookie', async () => {
    await setup();

    const content = screen.getByText(DASHBOARD_CONTENT);
    const switcher = screen.getByRole('button', { name: /globex\.com/i });

    expect(content).toBeVisible();
    expect(switcher).toBeVisible();
  });

  describe('with one membership', () => {
    beforeEach(() => {
      listMembershipsWithTenantsForUserMock.mockResolvedValue([
        { membership: membership1, tenant: tenant1 },
      ]);
    });

    it('renders the gated content with no switcher for a user with one membership', async () => {
      await setup();

      const content = screen.getByText(DASHBOARD_CONTENT);
      const switcher = screen.queryByRole('button', { name: /acme\.com/i });

      expect(content).toBeVisible();
      expect(redirect).not.toHaveBeenCalled();
      expect(switcher).not.toBeInTheDocument();
    });

    it('shows Tenant nav destinations under /dashboard, without a Platform section', async () => {
      await setup();

      const lookLink = screen.getByRole('link', { name: /look/i });
      const platformSection = screen.queryByText('Platform');

      expect(lookLink).toHaveAttribute('href', adminRoutes.dashboardLook());
      expect(platformSection).not.toBeInTheDocument();
    });
  });

  it('hides Languages and Team from a FREE tenant', async () => {
    mockCookie(TENANT_ID);

    await setup();

    const languagesLink = screen.queryByRole('link', { name: /languages/i });
    const teamText = screen.queryByText(TEAM);

    expect(languagesLink).not.toBeInTheDocument();
    expect(teamText).not.toBeInTheDocument();
  });

  it('shows Languages as a link and Team as "Coming soon" to a GROWTH tenant', async () => {
    await setup();

    const languagesLink = screen.getByRole('link', { name: /languages/i });
    const teamText = screen.getByText(TEAM);
    const teamLink = screen.queryByRole('link', { name: /team/i });

    expect(languagesLink).toHaveAttribute(
      'href',
      adminRoutes.dashboardLanguages(),
    );
    expect(teamText).toBeVisible();
    expect(teamLink).not.toBeInTheDocument();
  });

  it('shows the platform role, never OWNER, for a SUPERADMIN with no memberships row', async () => {
    getAdminByUserIdMock.mockResolvedValue({
      id: 'admin-1',
      userId: 'user-1',
      role: ADMIN_ROLE.SUPERADMIN,
      createdAt: new Date(),
    });
    listTenantsMock.mockResolvedValue([tenant1]);

    await setup();

    const content = screen.getByText(DASHBOARD_CONTENT);
    const platformRole = screen.getByText('Super admin · Platform');
    const ownerText = screen.queryByText(/Owner/);

    expect(content).toBeVisible();
    expect(platformRole).toBeVisible();
    expect(ownerText).not.toBeInTheDocument();
  });
});
