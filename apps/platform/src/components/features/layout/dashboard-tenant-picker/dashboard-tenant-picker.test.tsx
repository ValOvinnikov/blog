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
  it('renders a heading and every tenant as a visible link through the select-tenant endpoint', () => {
    render(<DashboardTenantPicker tenants={tenants} />);

    const main = screen.getByRole('main');
    expect(
      within(main).getByRole('heading', { name: 'Choose a workspace' }),
    ).toBeVisible();

    const acmeLink = within(main).getByRole('link', { name: /acme/i });
    const globexLink = within(main).getByRole('link', { name: /globex/i });
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
    render(<DashboardTenantPicker tenants={tenants} />);

    for (const link of screen.getAllByRole('link')) {
      expect(link).not.toHaveAttribute('aria-current');
    }
  });

  it('labels an archived tenant', () => {
    render(<DashboardTenantPicker tenants={tenants} />);

    expect(
      within(screen.getByRole('link', { name: /globex/i })).getByText(
        'Archived',
      ),
    ).toBeVisible();
    expect(
      within(screen.getByRole('link', { name: /acme/i })).queryByText(
        'Archived',
      ),
    ).not.toBeInTheDocument();
  });

  it('renders nothing for an empty tenant list', () => {
    render(<DashboardTenantPicker tenants={[]} />);

    expect(screen.queryByRole('main')).not.toBeInTheDocument();
  });

  it('offers a sign out', () => {
    render(<DashboardTenantPicker tenants={tenants} />);

    expect(screen.getByRole('button', { name: 'Sign out' })).toBeVisible();
  });
});
