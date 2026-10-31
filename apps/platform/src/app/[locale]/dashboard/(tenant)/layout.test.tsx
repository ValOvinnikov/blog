import { ADMIN_ROLE, TENANT_PLAN } from '@blog/db/constants';
import { faker } from '@faker-js/faker';
import messages from '@platform/i18n/messages/en.json';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
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
import { ACTIVE_TENANT_COOKIE } from '@platform/utils/active-tenant-cookie/active-tenant-cookie';
import { adminRoutes } from '@platform/utils/routes/routes';

import DashboardTenantLayout from './layout';

faker.seed(2214);

const {
  listMembershipsWithTenantsForUserMock,
  listTenantsMock,
  getAdminByUserIdMock,
  countLeadsForTenantMock,
  countUnreadLeadsForTenantMock,
  cookiesMock,
} = vi.hoisted(() => ({
  listMembershipsWithTenantsForUserMock: vi.fn(),
  listTenantsMock: vi.fn(),
  getAdminByUserIdMock: vi.fn(),
  countLeadsForTenantMock: vi.fn(),
  countUnreadLeadsForTenantMock: vi.fn(),
  cookiesMock: vi.fn(),
}));

vi.mock('@platform/server/auth/auth');

vi.mock('next/headers', () => ({
  cookies: cookiesMock,
  headers: vi.fn(async () => new Headers()),
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

const { navSections, roleLabel } = messages;
const t = makeEnTranslator();

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
const MOCK_DASHBOARD_CONTENT = faker.lorem.sentence();
const MOCK_UNREAD_LEADS_COUNT = faker.number.int({ min: 2, max: 9 });

const switcherNamed = (domain: string) => (name: string) =>
  name.includes(domain);

const setup = customRenderAsync(DashboardTenantLayout, {
  children: <div>{MOCK_DASHBOARD_CONTENT}</div>,
});

describe(`<${DashboardTenantLayout.name}/>`, () => {
  beforeEach(() => {
    getAdminByUserIdMock.mockResolvedValue(undefined);
    listTenantsMock.mockResolvedValue([MOCK_FREE_TENANT]);
    countLeadsForTenantMock.mockResolvedValue(0);
    countUnreadLeadsForTenantMock.mockResolvedValue(0);
    listMembershipsWithTenantsForUserMock.mockResolvedValue([
      { membership: MOCK_FREE_MEMBERSHIP, tenant: MOCK_FREE_TENANT },
      { membership: MOCK_GROWTH_MEMBERSHIP, tenant: MOCK_GROWTH_TENANT },
    ]);
    cookiesMock.mockResolvedValue({
      has: vi.fn(() => false),
      get: vi.fn((name: string) =>
        name === ACTIVE_TENANT_COOKIE
          ? { value: MOCK_OTHER_TENANT_ID }
          : undefined,
      ),
    });
  });

  describe('with several memberships', () => {
    beforeEach(async () => {
      await setup();
    });

    it('renders the active tenant with a tenant switcher', () => {
      const content = screen.getByText(MOCK_DASHBOARD_CONTENT);
      const switcher = screen.getByRole('button', {
        name: switcherNamed(MOCK_OTHER_TENANT_DOMAIN),
      });

      expect(content).toBeVisible();
      expect(switcher).toBeVisible();
    });

    it('offers Leads on a plan with the contact form', () => {
      const leadsLink = screen.getByRole('link', { name: navSections.leads });

      expect(leadsLink).toHaveAttribute('href', adminRoutes.dashboardLeads());
    });
  });

  it("shows the site's unread lead count beside Leads", async () => {
    countUnreadLeadsForTenantMock.mockResolvedValueOnce(
      MOCK_UNREAD_LEADS_COUNT,
    );

    await setup();

    const leadsLink = screen.getByRole('link', {
      name: new RegExp(navSections.leads),
    });

    expect(leadsLink).toHaveTextContent(
      t('navSections.badgeUnreadLeads', { count: MOCK_UNREAD_LEADS_COUNT }),
    );
    expect(countUnreadLeadsForTenantMock).toHaveBeenCalledWith(
      MOCK_OTHER_TENANT_ID,
    );
  });

  describe('with one membership', () => {
    beforeEach(async () => {
      listMembershipsWithTenantsForUserMock.mockResolvedValue([
        { membership: MOCK_FREE_MEMBERSHIP, tenant: MOCK_FREE_TENANT },
      ]);
      await setup();
    });

    it('renders the gated content with no tenant switcher', () => {
      const content = screen.getByText(MOCK_DASHBOARD_CONTENT);
      const switcher = screen.queryByRole('button', {
        name: switcherNamed(MOCK_TENANT_DOMAIN),
      });

      expect(content).toBeVisible();
      expect(switcher).not.toBeInTheDocument();
    });

    it('links the nav to /dashboard pages, without a Platform section', () => {
      const lookLink = screen.getByRole('link', { name: navSections.look });
      const platformSection = screen.queryByText(navSections.platformLabel);

      expect(lookLink).toHaveAttribute('href', adminRoutes.dashboardLook());
      expect(platformSection).not.toBeInTheDocument();
    });
  });

  it('shows the platform role, never OWNER, for a SUPERADMIN with no memberships', async () => {
    getAdminByUserIdMock.mockResolvedValue(
      mockAdmin({ role: ADMIN_ROLE.SUPERADMIN }),
    );
    listMembershipsWithTenantsForUserMock.mockResolvedValue([]);

    await setup();

    const content = screen.getByText(MOCK_DASHBOARD_CONTENT);
    const platformRole = screen.getByText(
      t('topbar.roleChip', {
        role: roleLabel.SUPERADMIN,
        scope: navSections.platformLabel,
      }),
    );
    const ownerRole = screen.queryByText(new RegExp(roleLabel.OWNER));

    expect(content).toBeVisible();
    expect(platformRole).toBeVisible();
    expect(ownerRole).not.toBeInTheDocument();
  });
});
