import type { TTenant } from '@blog/db/schema/tenants';
import {
  renderWithIntl,
  screen,
  within,
} from '@platform/testing/custom-render';

import { DashboardTenantPicker } from './dashboard-tenant-picker';

const render = renderWithIntl;

const tenants = [
  {
    id: 'tenant-1',
    name: 'Acme Inc.',
    primaryDomain: 'acme.example.com',
    deprovisionedAt: null,
  },
  {
    id: 'tenant-2',
    name: 'Globex Corp.',
    primaryDomain: 'globex.example.com',
    deprovisionedAt: new Date('2026-01-01'),
  },
] as TTenant[];

describe(DashboardTenantPicker, () => {
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
      '/api/dashboard/select-tenant?tenantId=tenant-1',
    );
    expect(globexLink).toBeVisible();
    expect(globexLink).toHaveAttribute(
      'href',
      '/api/dashboard/select-tenant?tenantId=tenant-2',
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
});
