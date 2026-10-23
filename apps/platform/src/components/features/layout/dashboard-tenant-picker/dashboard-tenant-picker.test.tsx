import {
  renderWithIntl,
  screen,
  within,
} from '@platform/testing/custom-render';
import {
  makeTenant,
  MOCK_OTHER_TENANT_DOMAIN,
  MOCK_OTHER_TENANT_ID,
  MOCK_OTHER_TENANT_NAME,
  TENANT_ID,
} from '@platform/testing/tenants/fixtures';

import { DashboardTenantPicker } from './dashboard-tenant-picker';

vi.mock('@platform/server/auth/sign-out-action');

const render = renderWithIntl;

const tenants = [
  makeTenant(),
  makeTenant({
    id: MOCK_OTHER_TENANT_ID,
    name: MOCK_OTHER_TENANT_NAME,
    primaryDomain: MOCK_OTHER_TENANT_DOMAIN,
    deprovisionedAt: new Date('2026-01-01'),
  }),
];

describe(`<${DashboardTenantPicker.name}/>`, () => {
  describe('with tenants', () => {
    beforeEach(() => {
      render(<DashboardTenantPicker tenants={tenants} />);
    });

    it('renders a heading and every tenant as a visible link through the select-tenant endpoint', () => {
      const main = screen.getByRole('main');
      const heading = within(main).getByRole('heading', {
        name: 'Choose a workspace',
      });
      const acmeLink = within(main).getByRole('link', { name: /acme/i });
      const globexLink = within(main).getByRole('link', { name: /globex/i });

      expect(heading).toBeVisible();
      expect(acmeLink).toBeVisible();
      expect(acmeLink).toHaveAttribute(
        'href',
        `/api/dashboard/select-tenant?tenantId=${TENANT_ID}`,
      );
      expect(globexLink).toBeVisible();
      expect(globexLink).toHaveAttribute(
        'href',
        `/api/dashboard/select-tenant?tenantId=${MOCK_OTHER_TENANT_ID}`,
      );
    });

    it('marks no tenant as the current one', () => {
      for (const link of screen.getAllByRole('link')) {
        expect(link).not.toHaveAttribute('aria-current');
      }
    });

    it('labels an archived tenant', () => {
      const globexLink = screen.getByRole('link', { name: /globex/i });
      const acmeLink = screen.getByRole('link', { name: /acme/i });
      const globexBadge = within(globexLink).getByText('Archived');
      const acmeBadge = within(acmeLink).queryByText('Archived');

      expect(globexBadge).toBeVisible();
      expect(acmeBadge).not.toBeInTheDocument();
    });

    it('offers a sign out', () => {
      const signOutButton = screen.getByRole('button', { name: 'Sign out' });

      expect(signOutButton).toBeVisible();
    });
  });

  it('renders nothing for an empty tenant list', () => {
    render(<DashboardTenantPicker tenants={[]} />);

    const main = screen.queryByRole('main');

    expect(main).not.toBeInTheDocument();
  });
});
