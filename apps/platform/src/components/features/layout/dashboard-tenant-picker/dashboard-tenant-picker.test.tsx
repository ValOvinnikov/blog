import messages from '@platform/i18n/messages/en.json';
import { MOCK_SIGN_IN_EMAIL } from '@platform/testing/auth/fixtures';
import { customRender, screen, within } from '@platform/testing/custom-render';
import {
  MOCK_ARCHIVED_AT,
  MOCK_OTHER_TENANT_DOMAIN,
  MOCK_OTHER_TENANT_ID,
  MOCK_OTHER_TENANT_NAME,
  MOCK_TENANT_ID,
  MOCK_TENANT_NAME,
  mockTenant,
} from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';

import { DashboardTenantPicker } from './dashboard-tenant-picker';

vi.mock('@platform/server/auth/sign-out-action');

const ARCHIVED_LABEL = messages.tenantSwitcher.archived;
const MOCK_TENANT_NAME_PATTERN = new RegExp(MOCK_TENANT_NAME);
const MOCK_OTHER_TENANT_NAME_PATTERN = new RegExp(MOCK_OTHER_TENANT_NAME);

const setup = customRender(DashboardTenantPicker, {
  accountEmail: MOCK_SIGN_IN_EMAIL,
  tenants: [
    mockTenant(),
    mockTenant({
      id: MOCK_OTHER_TENANT_ID,
      name: MOCK_OTHER_TENANT_NAME,
      primaryDomain: MOCK_OTHER_TENANT_DOMAIN,
      deprovisionedAt: MOCK_ARCHIVED_AT,
    }),
  ],
});

describe(`<${DashboardTenantPicker.name}/>`, () => {
  describe('with tenants', () => {
    beforeEach(() => {
      setup();
    });

    it('lists every tenant under the heading, each linking to select it', () => {
      const main = screen.getByRole('main');
      const heading = within(main).getByRole('heading', {
        name: messages.dashboardTenantPicker.heading,
      });
      const tenantLink = within(main).getByRole('link', {
        name: MOCK_TENANT_NAME_PATTERN,
      });
      const otherTenantLink = within(main).getByRole('link', {
        name: MOCK_OTHER_TENANT_NAME_PATTERN,
      });

      expect(heading).toBeVisible();
      expect(tenantLink).toBeVisible();
      expect(tenantLink).toHaveAttribute(
        'href',
        adminRoutes.dashboardSelectTenantHref(MOCK_TENANT_ID),
      );
      expect(otherTenantLink).toBeVisible();
      expect(otherTenantLink).toHaveAttribute(
        'href',
        adminRoutes.dashboardSelectTenantHref(MOCK_OTHER_TENANT_ID),
      );
    });

    it('marks no tenant as the current one', () => {
      const links = screen.getAllByRole('link');

      for (const link of links) {
        expect(link).not.toHaveAttribute('aria-current');
      }
    });

    it('labels an archived tenant', () => {
      const archivedTenantLink = screen.getByRole('link', {
        name: MOCK_OTHER_TENANT_NAME_PATTERN,
      });
      const activeTenantLink = screen.getByRole('link', {
        name: MOCK_TENANT_NAME_PATTERN,
      });
      const archivedBadge =
        within(archivedTenantLink).getByText(ARCHIVED_LABEL);
      const activeBadge = within(activeTenantLink).queryByText(ARCHIVED_LABEL);

      expect(archivedBadge).toBeVisible();
      expect(activeBadge).not.toBeInTheDocument();
    });

    it('names the product, then shows the heading, the tenants and the account in that order', () => {
      const main = screen.getByRole('main');
      const wordmark = within(main).getByText(
        messages.centeredCardFrame.brandName,
      );
      const heading = within(main).getByRole('heading', {
        name: messages.dashboardTenantPicker.heading,
      });
      const tenantLink = within(main).getByRole('link', {
        name: MOCK_TENANT_NAME_PATTERN,
      });
      const signOutButton = within(main).getByRole('button', {
        name: messages.account.signOut,
      });

      expect(wordmark.compareDocumentPosition(heading)).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      );
      expect(heading.compareDocumentPosition(tenantLink)).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      );
      expect(tenantLink.compareDocumentPosition(signOutButton)).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      );
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

  it('renders nothing for an empty tenant list', () => {
    setup({ tenants: [] });

    const main = screen.queryByRole('main');

    expect(main).not.toBeInTheDocument();
  });
});
