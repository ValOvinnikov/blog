import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import { ADMIN_ROLE, MEMBERSHIP_ROLE, TENANT_PLAN } from '@blog/db/constants';
import { isUndefined } from '@blog/utils/primitives';
import { auth } from '@platform/server/auth/auth';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockMembership } from '@platform/testing/memberships/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import {
  MOCK_OTHER_TENANT_DOMAIN,
  MOCK_OTHER_TENANT_ID,
  MOCK_OTHER_TENANT_NAME,
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_ID,
  mockTenant,
} from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';

import DashboardTenantLayout from './layout';

const {
  listMembershipsWithTenantsForUserMock,
  listTenantsMock,
  getAdminByUserIdMock,
  countLeadsForTenantMock,
  countUnreadLeadsForTenantMock,
  cookiesMock,
  resolveIsSidebarCollapsedMock,
} = vi.hoisted(() => ({
  listMembershipsWithTenantsForUserMock: vi.fn(),
  listTenantsMock: vi.fn(),
  getAdminByUserIdMock: vi.fn(),
  countLeadsForTenantMock: vi.fn(),
  countUnreadLeadsForTenantMock: vi.fn(),
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
    tenants: { listTenants: listTenantsMock },
    admins: { getAdminByUserId: getAdminByUserIdMock },
    leads: {
      countLeadsForTenant: countLeadsForTenantMock,
      countUnreadLeadsForTenant: countUnreadLeadsForTenantMock,
    },
  },
}));

vi.mock('next/headers', () => ({
  cookies: cookiesMock,
  headers: async () => new Headers(),
}));

const MOCK_FREE_TENANT = mockTenant({ plan: TENANT_PLAN.FREE });
const MOCK_GROWTH_TENANT = mockTenant({
  id: MOCK_OTHER_TENANT_ID,
  name: MOCK_OTHER_TENANT_NAME,
  primaryDomain: MOCK_OTHER_TENANT_DOMAIN,
  plan: TENANT_PLAN.GROWTH,
});
const MOCK_FREE_MEMBERSHIP = mockMembership({ tenantId: MOCK_TENANT_ID });
const MOCK_GROWTH_MEMBERSHIP = mockMembership({
  tenantId: MOCK_OTHER_TENANT_ID,
});
const MOCK_DASHBOARD_CONTENT = 'dashboard content';
const MOCK_STORED_LEADS_COUNT = 3;
const MOCK_UNREAD_LEADS_COUNT = 3;
const LEADS = 'Leads';
const TEAM = 'Team';

const mockActiveTenantCookie = (value: string | undefined) => {
  cookiesMock.mockResolvedValue({
    get: vi.fn(() => (isUndefined(value) ? undefined : { value })),
  });
};

const switcherNamed = (domain: string) => (name: string) =>
  name.includes(domain);

const setup = customRenderAsync(DashboardTenantLayout, {
  children: <div>{MOCK_DASHBOARD_CONTENT}</div>,
});

describe(`<${DashboardTenantLayout.name}/>`, () => {
  beforeEach(() => {
    vi.mocked(auth).mockReset();
    getAdminByUserIdMock.mockResolvedValue(undefined);
    countLeadsForTenantMock.mockResolvedValue(0);
    countUnreadLeadsForTenantMock.mockResolvedValue(0);
    resolveIsSidebarCollapsedMock.mockResolvedValue(false);
    listMembershipsWithTenantsForUserMock.mockResolvedValue([
      { membership: MOCK_FREE_MEMBERSHIP, tenant: MOCK_FREE_TENANT },
      { membership: MOCK_GROWTH_MEMBERSHIP, tenant: MOCK_GROWTH_TENANT },
    ]);
    mockActiveTenantCookie(MOCK_OTHER_TENANT_ID);
  });

  it('offers Leads on a plan with the contact form', async () => {
    await setup();

    const leadsLink = screen.getByRole('link', { name: LEADS });

    expect(leadsLink).toHaveAttribute('href', adminRoutes.dashboardLeads());
  });

  it("shows the site's unread lead count beside Leads", async () => {
    countUnreadLeadsForTenantMock.mockResolvedValue(MOCK_UNREAD_LEADS_COUNT);

    await setup();

    const leadsLink = screen.getByRole('link', { name: /Leads/ });

    expect(leadsLink).toHaveTextContent(`${MOCK_UNREAD_LEADS_COUNT} new`);
    expect(countUnreadLeadsForTenantMock).toHaveBeenCalledWith(
      MOCK_OTHER_TENANT_ID,
    );
  });

  it('hides Leads from a plan without the contact form and no stored leads', async () => {
    mockActiveTenantCookie(MOCK_TENANT_ID);

    await setup();

    const leadsLink = screen.queryByRole('link', { name: LEADS });

    expect(leadsLink).not.toBeInTheDocument();
  });

  it('keeps Leads for a downgraded owner who still has stored leads', async () => {
    mockActiveTenantCookie(MOCK_TENANT_ID);
    countLeadsForTenantMock.mockResolvedValue(MOCK_STORED_LEADS_COUNT);

    await setup();

    const leadsLink = screen.getByRole('link', { name: LEADS });

    expect(leadsLink).toBeVisible();
  });

  it('hides Leads from an editor', async () => {
    listMembershipsWithTenantsForUserMock.mockResolvedValue([
      {
        membership: { ...MOCK_GROWTH_MEMBERSHIP, role: MEMBERSHIP_ROLE.EDITOR },
        tenant: MOCK_GROWTH_TENANT,
      },
    ]);

    await setup();

    const leadsLink = screen.queryByRole('link', { name: LEADS });

    expect(leadsLink).not.toBeInTheDocument();
  });

  it('redirects to sign-in without querying memberships when signed out', async () => {
    vi.mocked<() => Promise<Session | null>>(auth).mockResolvedValueOnce(null);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(redirect).toHaveBeenCalledWith(adminRoutes.signIn());
    expect(listMembershipsWithTenantsForUserMock).not.toHaveBeenCalled();
  });

  it('redirects to /onboarding for a user with no memberships', async () => {
    listMembershipsWithTenantsForUserMock.mockResolvedValue([]);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(redirect).toHaveBeenCalledWith(adminRoutes.onboarding());
  });

  it('redirects to the picker for several memberships and no active-tenant cookie', async () => {
    mockActiveTenantCookie(undefined);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(redirect).toHaveBeenCalledWith(adminRoutes.dashboardSelectTenant());
  });

  it('renders the active tenant and a switcher for several memberships', async () => {
    await setup();

    const content = screen.getByText(MOCK_DASHBOARD_CONTENT);
    const switcher = screen.getByRole('button', {
      name: switcherNamed(MOCK_OTHER_TENANT_DOMAIN),
    });

    expect(content).toBeVisible();
    expect(switcher).toBeVisible();
  });

  describe('with one membership', () => {
    beforeEach(async () => {
      listMembershipsWithTenantsForUserMock.mockResolvedValue([
        { membership: MOCK_FREE_MEMBERSHIP, tenant: MOCK_FREE_TENANT },
      ]);
      await setup();
    });

    it('renders the gated content with no switcher', () => {
      const content = screen.getByText(MOCK_DASHBOARD_CONTENT);
      const switcher = screen.queryByRole('button', {
        name: switcherNamed(MOCK_TENANT_DOMAIN),
      });

      expect(content).toBeVisible();
      expect(redirect).not.toHaveBeenCalled();
      expect(switcher).not.toBeInTheDocument();
    });

    it('shows Tenant nav destinations under /dashboard, without a Platform section', () => {
      const lookLink = screen.getByRole('link', { name: /look/i });
      const platformSection = screen.queryByText('Platform');

      expect(lookLink).toHaveAttribute('href', adminRoutes.dashboardLook());
      expect(platformSection).not.toBeInTheDocument();
    });

    it('hides Languages and Team from a FREE tenant', () => {
      const languagesLink = screen.queryByRole('link', { name: /languages/i });
      const teamText = screen.queryByText(TEAM);

      expect(languagesLink).not.toBeInTheDocument();
      expect(teamText).not.toBeInTheDocument();
    });
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

  it('shows the platform role, never OWNER, for a SUPERADMIN with no memberships', async () => {
    getAdminByUserIdMock.mockResolvedValue(
      mockAdmin({ role: ADMIN_ROLE.SUPERADMIN }),
    );
    listMembershipsWithTenantsForUserMock.mockResolvedValue([]);
    listTenantsMock.mockResolvedValue([MOCK_FREE_TENANT]);

    await setup();

    const content = screen.getByText(MOCK_DASHBOARD_CONTENT);
    const platformRole = screen.getByText('Super admin · Platform');
    const ownerText = screen.queryByText(/Owner/);

    expect(content).toBeVisible();
    expect(platformRole).toBeVisible();
    expect(ownerText).not.toBeInTheDocument();
  });
});
