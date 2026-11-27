import { faker } from '@faker-js/faker';
import messages from '@platform/i18n/messages/en.json';
import { auth } from '@platform/server/auth/auth';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import {
  customRenderAsync,
  screen,
  within,
} from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { mockMembership } from '@platform/testing/memberships/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { MOCK_SEATS_OVER_ONE_SEAT } from '@platform/testing/team/fixtures';
import {
  MOCK_OTHER_TENANT_DOMAIN,
  MOCK_OTHER_TENANT_ID,
  MOCK_OTHER_TENANT_NAME,
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_ID,
  mockTenant,
} from '@platform/testing/tenants/fixtures';
import { noEntitlementGrantQueries } from '@platform/testing/tenants/no-entitlement-grant-queries';
import { ACTIVE_TENANT_COOKIE } from '@platform/utils/active-tenant-cookie/active-tenant-cookie';
import { adminRoutes } from '@platform/utils/routes/routes';
import { TENANT_PLAN } from '@shinefold/config/constants';
import { ADMIN_ROLE } from '@shinefold/db/constants';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import DashboardTenantLayout from './layout';

faker.seed(2214);

const {
  listMembershipsWithTenantsForUserMock,
  listTenantsMock,
  getAdminByUserIdMock,
  countLeadsForTenantMock,
  countSeatsInUseMock,
  countUnlockedSeatsInUseMock,
  cookiesMock,
} = vi.hoisted(() => ({
  listMembershipsWithTenantsForUserMock: vi.fn(),
  listTenantsMock: vi.fn(),
  getAdminByUserIdMock: vi.fn(),
  countLeadsForTenantMock: vi.fn(),
  countSeatsInUseMock: vi.fn(),
  countUnlockedSeatsInUseMock: vi.fn(),
  cookiesMock: vi.fn(),
}));

vi.mock('@platform/server/auth/auth');
vi.mock('@platform/server/auth/sign-out-action');

vi.mock('next/headers', () => ({
  cookies: cookiesMock,
  headers: vi.fn(async () => new Headers()),
}));

vi.mock('@shinefold/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    ...noEntitlementGrantQueries(),
    memberships: {
      listMembershipsWithTenantsForUser: listMembershipsWithTenantsForUserMock,
    },
    tenants: { listTenants: listTenantsMock },
    admins: { getAdminByUserId: getAdminByUserIdMock },
    leads: {
      countLeadsForTenant: countLeadsForTenantMock,
    },
    membershipInvites: {
      countSeatsInUse: countSeatsInUseMock,
      countUnlockedSeatsInUse: countUnlockedSeatsInUseMock,
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

const switcherNamed = (domain: string) => (name: string) =>
  name.includes(domain);

const setup = customRenderAsync(DashboardTenantLayout, {
  children: <div>{MOCK_DASHBOARD_CONTENT}</div>,
});

describe(`<${DashboardTenantLayout.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    getAdminByUserIdMock.mockResolvedValue(undefined);
    listTenantsMock.mockResolvedValue([MOCK_FREE_TENANT]);
    countLeadsForTenantMock.mockResolvedValue(0);
    countSeatsInUseMock.mockResolvedValue(1);
    countUnlockedSeatsInUseMock.mockResolvedValue(1);
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

    it('offers Leads with no unread-count badge on a plan with the contact form', () => {
      const leadsLink = screen.getByRole('link', { name: navSections.leads });

      expect(leadsLink).toHaveAttribute('href', adminRoutes.dashboardLeads());
    });
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

    it('offers no Team on Free within its seats', () => {
      const teamLink = screen.queryByRole('link', { name: navSections.team });

      expect(teamLink).not.toBeInTheDocument();
    });

    it('links the nav to /dashboard pages, without a Platform section', () => {
      const lookLink = screen.getByRole('link', { name: navSections.look });
      const platformSection = screen.queryByRole('navigation', {
        name: navSections.platformLabel,
      });

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
    const session = await auth();

    const sidebar = screen.getByRole('complementary', {
      name: messages.sidebar.ariaLabel,
    });
    const accountTrigger = within(sidebar).getByRole('button', {
      name: new RegExp(session?.user?.email ?? ''),
    });
    await user.click(accountTrigger);
    const accountMenu = await screen.findByRole('menu', {
      name: messages.account.menuLabel,
    });
    const content = screen.getByText(MOCK_DASHBOARD_CONTENT);
    const platformRole = within(accountMenu).getByText(
      t('account.roleLine', {
        role: roleLabel.SUPERADMIN,
        scope: navSections.platformLabel,
      }),
    );
    const ownerRole = screen.queryByText(new RegExp(roleLabel.OWNER));

    expect(content).toBeVisible();
    expect(platformRole).toBeVisible();
    expect(ownerRole).not.toBeInTheDocument();
  });

  it.each([
    ['over its seats', MOCK_SEATS_OVER_ONE_SEAT],
    ['with a locked member', 1],
  ])(
    'offers Team to the owner of a Free site %s',
    async (_label, unlockedSeats) => {
      listMembershipsWithTenantsForUserMock.mockResolvedValue([
        { membership: MOCK_FREE_MEMBERSHIP, tenant: MOCK_FREE_TENANT },
      ]);
      countSeatsInUseMock.mockResolvedValue(MOCK_SEATS_OVER_ONE_SEAT);
      countUnlockedSeatsInUseMock.mockResolvedValue(unlockedSeats);

      await setup();
      const teamLink = screen.getByRole('link', { name: navSections.team });

      expect(teamLink).toHaveAttribute('href', adminRoutes.dashboardTeam());
    },
  );
});
