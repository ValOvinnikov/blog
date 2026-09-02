import { TENANT_PROVISIONING_STATUS } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';
import { renderWithIntl, screen } from '@platform/testing/custom-render';
import { makeTenant } from '@platform/testing/tenants/fixtures';

import { TenantsTable } from './tenants-table';

const render = renderWithIntl;

const buildTenant = (overrides: Partial<TTenant> = {}): TTenant =>
  makeTenant({
    provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
    ...overrides,
  });

describe(TenantsTable, () => {
  it('renders one row per tenant with its name, domain, plan and status', () => {
    render(
      <TenantsTable
        tenants={[
          buildTenant(),
          buildTenant({
            id: 'tenant-2',
            slug: 'harbor',
            name: 'Harbor Co.',
            primaryDomain: 'harbor.example.com',
            plan: 'GROWTH',
            status: 'SUSPENDED',
          }),
        ]}
      />,
    );

    expect(screen.getByText('Acme Inc.')).toBeVisible();
    expect(screen.getByText('acme.example.com')).toBeVisible();
    expect(screen.getByText('Free')).toBeVisible();
    expect(screen.getByText('Active')).toBeVisible();

    expect(screen.getByText('Harbor Co.')).toBeVisible();
    expect(screen.getByText('Growth')).toBeVisible();
    expect(screen.getByText('Suspended')).toBeVisible();
  });

  it('links a READY tenant\'s "Manage" control to its overview page', () => {
    render(
      <TenantsTable
        tenants={[
          buildTenant(),
          buildTenant({
            id: 'tenant-2',
            slug: 'harbor',
            name: 'Harbor Co.',
            primaryDomain: 'harbor.example.com',
          }),
        ]}
      />,
    );

    expect(
      screen.getByRole('link', { name: 'Manage Acme Inc.' }),
    ).toHaveAttribute('href', '/tenants/tenant-1');
    expect(
      screen.getByRole('link', { name: 'Manage Harbor Co.' }),
    ).toHaveAttribute('href', '/tenants/tenant-2');
  });

  it('links a not-yet-ready tenant\'s "Manage" control to its provisioning page', () => {
    render(
      <TenantsTable
        tenants={[
          buildTenant({
            provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
          }),
          buildTenant({
            id: 'tenant-2',
            slug: 'harbor',
            name: 'Harbor Co.',
            primaryDomain: 'harbor.example.com',
            provisioningStatus: TENANT_PROVISIONING_STATUS.FAILED,
          }),
        ]}
      />,
    );

    expect(
      screen.getByRole('link', { name: 'Manage Acme Inc.' }),
    ).toHaveAttribute('href', '/tenants/tenant-1/provisioning');
    expect(
      screen.getByRole('link', { name: 'Manage Harbor Co.' }),
    ).toHaveAttribute('href', '/tenants/tenant-2/provisioning');
  });

  it('renders an empty state instead of an empty table when there are no tenants', () => {
    render(<TenantsTable tenants={[]} />);

    expect(screen.getByText('No tenants yet.')).toBeVisible();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
