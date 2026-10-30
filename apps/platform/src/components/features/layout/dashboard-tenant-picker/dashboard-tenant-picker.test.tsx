import { MEMBERSHIP_ROLE, TENANT_PLAN } from '@blog/db/constants';
import { faker } from '@faker-js/faker';
import messages from '@platform/i18n/messages/en.json';
import type { TTenantPickerItem } from '@platform/server/tenants/to-tenant-picker-items';
import { MOCK_SIGN_IN_EMAIL } from '@platform/testing/auth/fixtures';
import { customRender, screen, within } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import {
  MOCK_OTHER_TENANT_DOMAIN,
  MOCK_OTHER_TENANT_ID,
  MOCK_OTHER_TENANT_NAME,
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_ID,
  MOCK_TENANT_NAME,
} from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';
import { fireEvent } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { DashboardTenantPicker } from './dashboard-tenant-picker';

vi.mock('@platform/server/auth/sign-out-action');

faker.seed(6270);

const MOCK_ARCHIVED_TENANT_ID = faker.string.uuid();
const MOCK_ARCHIVED_TENANT_NAME = faker.company.name();
const MOCK_ARCHIVED_TENANT_DOMAIN = faker.internet.domainName();
const MOCK_UNMATCHED_QUERY = faker.string.alpha(12);
const MOCK_OVERFLOWING_HEIGHT = 5000;
const t = makeEnTranslator('dashboardTenantPicker');
const FILTER_LABEL = messages.dashboardTenantPicker.filterLabel;
const ARCHIVED_LABEL = messages.tenantSwitcher.archived;
const TENANT_NAME_PATTERN = new RegExp(MOCK_TENANT_NAME);
const OTHER_TENANT_NAME_PATTERN = new RegExp(MOCK_OTHER_TENANT_NAME);
const ARCHIVED_TENANT_NAME_PATTERN = new RegExp(MOCK_ARCHIVED_TENANT_NAME);

const mockPickerItem = (
  overrides: Partial<TTenantPickerItem> = {},
): TTenantPickerItem => ({
  id: MOCK_TENANT_ID,
  name: MOCK_TENANT_NAME,
  primaryDomain: MOCK_TENANT_DOMAIN,
  isArchived: false,
  role: MEMBERSHIP_ROLE.OWNER,
  plan: TENANT_PLAN.GROWTH,
  ...overrides,
});

const setup = customRender(DashboardTenantPicker, {
  accountEmail: MOCK_SIGN_IN_EMAIL,
  tenants: [
    mockPickerItem(),
    mockPickerItem({
      id: MOCK_OTHER_TENANT_ID,
      name: MOCK_OTHER_TENANT_NAME,
      primaryDomain: MOCK_OTHER_TENANT_DOMAIN,
      role: undefined,
      plan: TENANT_PLAN.FREE,
    }),
    mockPickerItem({
      id: MOCK_ARCHIVED_TENANT_ID,
      name: MOCK_ARCHIVED_TENANT_NAME,
      primaryDomain: MOCK_ARCHIVED_TENANT_DOMAIN,
      isArchived: true,
    }),
  ],
});

const overflowViewportWhileUnfiltered = () =>
  vi
    .spyOn(document.documentElement, 'scrollHeight', 'get')
    .mockImplementation(() =>
      screen.queryAllByRole('link').length > 1 ? MOCK_OVERFLOWING_HEIGHT : 0,
    );

const overflowViewport = () =>
  vi
    .spyOn(document.documentElement, 'scrollHeight', 'get')
    .mockReturnValue(MOCK_OVERFLOWING_HEIGHT);

describe(`<${DashboardTenantPicker.name}/>`, () => {
  describe('with tenants that fit the viewport', () => {
    beforeEach(() => {
      setup();
    });

    it('names the page with a single heading', () => {
      const headings = screen.getAllByRole('heading', { level: 1 });

      expect(headings).toHaveLength(1);
      expect(headings[0]).toHaveTextContent(
        messages.dashboardTenantPicker.heading,
      );
    });

    it('labels the main region with the page heading', () => {
      const main = screen.getByRole('main');

      expect(main).toHaveAccessibleName(messages.dashboardTenantPicker.heading);
    });

    it('links each tenant to selecting it', () => {
      const tenantLink = screen.getByRole('link', {
        name: TENANT_NAME_PATTERN,
      });

      expect(tenantLink).toHaveAttribute(
        'href',
        adminRoutes.dashboardSelectTenantHref(MOCK_TENANT_ID),
      );
    });

    it('shows each active tenant’s domain, role and plan', () => {
      const tenantLink = screen.getByRole('link', {
        name: TENANT_NAME_PATTERN,
      });

      const domain = within(tenantLink).getByText(MOCK_TENANT_DOMAIN);
      const role = within(tenantLink).getByText(messages.roleLabel.OWNER);
      const plan = within(tenantLink).getByText(
        messages.tenantsTable.plan.GROWTH,
      );

      expect(domain).toBeVisible();
      expect(role).toBeVisible();
      expect(plan).toBeVisible();
    });

    it('shows only the plan when the role is not known', () => {
      const otherTenantLink = screen.getByRole('link', {
        name: OTHER_TENANT_NAME_PATTERN,
      });

      const plan = within(otherTenantLink).getByText(
        messages.tenantsTable.plan.FREE,
      );
      const role = within(otherTenantLink).queryByText(
        messages.roleLabel.OWNER,
      );

      expect(plan).toBeVisible();
      expect(role).not.toBeInTheDocument();
    });

    it('lists archived tenants as read-only under their own label, after the active ones', () => {
      const archivedList = screen.getByRole('list', { name: ARCHIVED_LABEL });
      const archivedLink = within(archivedList).getByRole('link', {
        name: ARCHIVED_TENANT_NAME_PATTERN,
      });
      const tenantLink = screen.getByRole('link', {
        name: TENANT_NAME_PATTERN,
      });

      const readOnly = within(archivedLink).getByText(
        messages.dashboardTenantPicker.readOnly,
      );

      expect(readOnly).toBeVisible();
      expect(tenantLink.compareDocumentPosition(archivedLink)).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      );
    });

    it('offers no filter', () => {
      const filter = screen.queryByRole('searchbox', { name: FILTER_LABEL });

      expect(filter).not.toBeInTheDocument();
    });

    it('names the signed-in email and offers a sign out', () => {
      const email = screen.getByText(MOCK_SIGN_IN_EMAIL, { exact: false });
      const signOutButton = screen.getByRole('button', {
        name: messages.account.signOut,
      });

      expect(email).toBeVisible();
      expect(signOutButton).toBeVisible();
    });
  });

  describe('with more tenants than the viewport fits', () => {
    let user: UserEvent;

    beforeEach(() => {
      user = userEvent.setup();
      overflowViewport();
      setup();
    });

    it('offers a filter and counts the tenants shown', () => {
      const filter = screen.getByRole('searchbox', { name: FILTER_LABEL });
      const status = screen.getByRole('status');

      expect(filter).toBeVisible();
      expect(status).toHaveTextContent(t('visibleCount', { count: 3 }));
    });

    it('narrows the tenants by name', async () => {
      const filter = screen.getByRole('searchbox', { name: FILTER_LABEL });
      await user.type(filter, MOCK_OTHER_TENANT_NAME);

      const links = screen.getAllByRole('link');
      const status = screen.getByRole('status');

      expect(links).toHaveLength(1);
      expect(links[0]).toHaveAccessibleName(OTHER_TENANT_NAME_PATTERN);
      expect(status).toHaveTextContent(t('visibleCount', { count: 1 }));
    });

    it('narrows the tenants by domain, keeping an archived match under its label', async () => {
      const filter = screen.getByRole('searchbox', { name: FILTER_LABEL });
      await user.type(filter, MOCK_ARCHIVED_TENANT_DOMAIN);

      const archivedList = screen.getByRole('list', { name: ARCHIVED_LABEL });
      const archivedLink = within(archivedList).getByRole('link', {
        name: ARCHIVED_TENANT_NAME_PATTERN,
      });
      const links = screen.getAllByRole('link');

      expect(archivedLink).toBeVisible();
      expect(links).toHaveLength(1);
    });

    it('says so when nothing matches', async () => {
      const filter = screen.getByRole('searchbox', { name: FILTER_LABEL });
      await user.type(filter, MOCK_UNMATCHED_QUERY);

      const noMatch = screen.getByText(
        t('noMatch', { query: MOCK_UNMATCHED_QUERY }),
      );
      const link = screen.queryByRole('link');

      expect(noMatch).toBeVisible();
      expect(link).not.toBeInTheDocument();
    });

    it('keeps a filter holding text after the tenants fit again', async () => {
      const filter = screen.getByRole('searchbox', { name: FILTER_LABEL });
      await user.type(filter, MOCK_TENANT_NAME);
      vi.restoreAllMocks();
      fireEvent(window, new Event('resize'));

      expect(filter).toBeVisible();
    });

    it('keeps focus in the filter when a query that made the tenants fit is cleared', async () => {
      overflowViewportWhileUnfiltered();
      const filter = screen.getByRole('searchbox', { name: FILTER_LABEL });
      await user.type(filter, MOCK_OTHER_TENANT_NAME);

      await user.clear(filter);

      expect(filter).toBeInTheDocument();
      expect(filter).toHaveFocus();
    });
  });

  it('hides the filter once an empty one fits the viewport again', () => {
    overflowViewport();
    setup();
    vi.restoreAllMocks();

    fireEvent(window, new Event('resize'));

    const filter = screen.queryByRole('searchbox', { name: FILTER_LABEL });

    expect(filter).not.toBeInTheDocument();
  });

  it('renders nothing for an empty tenant list', () => {
    setup({ tenants: [] });

    const main = screen.queryByRole('main');

    expect(main).not.toBeInTheDocument();
  });
});
