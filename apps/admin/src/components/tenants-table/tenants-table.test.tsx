import { renderWithIntl, screen } from '@admin/testing/custom-render';
import type { TTenant } from '@blog/db/schema/tenants';

import { TenantsTable } from './tenants-table';

const render = renderWithIntl;

const buildTenant = (overrides: Partial<TTenant> = {}): TTenant => ({
  id: 'tenant-1',
  slug: 'acme',
  name: 'Acme Inc.',
  primaryDomain: 'acme.example.com',
  sanityProjectId: 'proj-1',
  sanityDataset: 'production',
  locale: 'en',
  plan: 'FREE',
  status: 'ACTIVE',
  createdAt: new Date('2026-04-02T00:00:00.000Z'),
  updatedAt: new Date('2026-04-02T00:00:00.000Z'),
  ...overrides,
});

describe(TenantsTable, () => {
  it('renders one row per tenant with its slug, domain, plan and status', () => {
    render(
      <TenantsTable
        tenants={[
          buildTenant(),
          buildTenant({
            id: 'tenant-2',
            slug: 'harbor',
            primaryDomain: 'harbor.example.com',
            plan: 'GROWTH',
            status: 'SUSPENDED',
          }),
        ]}
      />,
    );

    expect(screen.getByText('acme')).toBeVisible();
    expect(screen.getByText('acme.example.com')).toBeVisible();
    expect(screen.getByText('Free')).toBeVisible();
    expect(screen.getByText('Active')).toBeVisible();

    expect(screen.getByText('harbor')).toBeVisible();
    expect(screen.getByText('Growth')).toBeVisible();
    expect(screen.getByText('Suspended')).toBeVisible();
  });

  it('renders an empty state instead of an empty table when there are no tenants', () => {
    render(<TenantsTable tenants={[]} />);

    expect(screen.getByText('No tenants yet.')).toBeVisible();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
