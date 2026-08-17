import { renderWithIntl, screen } from '@admin/testing/custom-render';
import { makeTenant } from '@admin/testing/tenants/fixtures';

import { TenantsView } from './tenants-view';

const render = renderWithIntl;

const tenant = makeTenant();

describe(TenantsView, () => {
  it('renders the real tenant row', () => {
    render(<TenantsView tenants={[tenant]} showArchived={false} />);

    expect(screen.getByRole('heading', { name: 'Tenants' })).toBeVisible();
    expect(screen.getByText('Acme Inc.')).toBeVisible();
  });

  it('links add-tenant to the wizard', () => {
    render(<TenantsView tenants={[tenant]} showArchived={false} />);

    const addTenant = screen.getByRole('link', { name: /add tenant/i });
    expect(addTenant).toHaveAttribute('href', '/add-tenant');
  });

  it('shows the archived-tenants toggle set to Active by default', () => {
    render(<TenantsView tenants={[tenant]} showArchived={false} />);

    expect(screen.getByRole('radio', { name: 'Active' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('shows the archived-tenants toggle set to All when showArchived is true', () => {
    render(<TenantsView tenants={[tenant]} showArchived={true} />);

    expect(screen.getByRole('radio', { name: 'All' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });
});
