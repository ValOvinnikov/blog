import { renderWithIntl, screen } from '@admin/testing/custom-render';
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
  locale: 'en',
  plan: 'FREE',
  status: 'ACTIVE',
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
