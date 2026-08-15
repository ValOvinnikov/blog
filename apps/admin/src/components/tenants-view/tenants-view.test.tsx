import { renderWithIntl, screen } from '@admin/testing/custom-render';
import {
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP,
} from '@blog/config';
import type { TTenant } from '@blog/db/schema/tenants';

import { TenantsView } from './tenants-view';

const render = renderWithIntl;

const tenant: TTenant = {
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
};

describe(TenantsView, () => {
  it('renders the real tenant row', () => {
    render(<TenantsView tenants={[tenant]} />);

    expect(screen.getByRole('heading', { name: 'Tenants' })).toBeVisible();
    expect(screen.getByText('Acme Inc.')).toBeVisible();
  });

  it('renders add-tenant as visibly disabled with its reason stated', () => {
    render(<TenantsView tenants={[tenant]} />);

    const addTenant = screen.getByRole('button', { name: /add tenant/i });
    expect(addTenant).toBeDisabled();
    expect(screen.getByText(/provisioning is deferred/i)).toBeVisible();
  });
});
