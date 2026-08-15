import { renderWithIntl, screen } from '@admin/testing/custom-render';
import { makeTenant } from '@admin/testing/tenants/fixtures';

import { TenantsView } from './tenants-view';

const render = renderWithIntl;

const tenant = makeTenant();

describe(TenantsView, () => {
  it('renders the real tenant row', () => {
    render(<TenantsView tenants={[tenant]} />);

    expect(screen.getByRole('heading', { name: 'Tenants' })).toBeVisible();
    expect(screen.getByText('Acme Inc.')).toBeVisible();
  });

  it('links add-tenant to the wizard', () => {
    render(<TenantsView tenants={[tenant]} />);

    const addTenant = screen.getByRole('link', { name: /add tenant/i });
    expect(addTenant).toHaveAttribute('href', '/add-tenant');
  });
});
