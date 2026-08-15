import { renderWithIntl, screen } from '@admin/testing/custom-render';
import {
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP,
} from '@blog/config';
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
  sanityReadTokenEncrypted: null,
  locale: 'en',
  plan: 'FREE',
  status: 'ACTIVE',
  provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
  provisioningSteps: {
    [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: { status: 'done' },
    [TENANT_PROVISIONING_STEP.SEED_CONTENT]: { status: 'done' },
    [TENANT_PROVISIONING_STEP.DEPLOY_STUDIO]: { status: 'done' },
    [TENANT_PROVISIONING_STEP.PERSIST_TOKEN]: { status: 'done' },
    [TENANT_PROVISIONING_STEP.MAP_DOMAIN]: { status: 'done' },
  },
  studioVercelProjectId: null,
  seededAt: new Date('2026-04-02T00:00:00.000Z'),
  createdAt: new Date('2026-04-02T00:00:00.000Z'),
  updatedAt: new Date('2026-04-02T00:00:00.000Z'),
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

  it('renders an empty state instead of an empty table when there are no tenants', () => {
    render(<TenantsTable tenants={[]} />);

    expect(screen.getByText('No tenants yet.')).toBeVisible();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
