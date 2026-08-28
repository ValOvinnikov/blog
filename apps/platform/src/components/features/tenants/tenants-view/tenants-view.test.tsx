import { renderWithIntl, screen } from '@platform/testing/custom-render';
import { makeTenant } from '@platform/testing/tenants/fixtures';

import { TenantsView } from './tenants-view';

const render = renderWithIntl;

const tenant = makeTenant();

describe(TenantsView, () => {
  it('renders the real tenant row', () => {
    render(<TenantsView tenants={[tenant]} shouldShowArchived={false} />);

    expect(screen.getByRole('heading', { name: 'Tenants' })).toBeVisible();
    expect(screen.getByText('Acme Inc.')).toBeVisible();
  });

  it("renders the description's code chunk as a real <code> element", () => {
    render(<TenantsView tenants={[tenant]} shouldShowArchived={false} />);

    const code = screen.getByText('tenants', { selector: 'code' });
    expect(code.tagName).toBe('CODE');
  });

  it('links add-tenant to the wizard', () => {
    render(<TenantsView tenants={[tenant]} shouldShowArchived={false} />);

    const addTenant = screen.getByRole('link', { name: /add tenant/i });
    expect(addTenant).toHaveAttribute('href', '/tenants/new');
  });

  it('shows the archived-tenants toggle set to Active by default', () => {
    render(<TenantsView tenants={[tenant]} shouldShowArchived={false} />);

    expect(screen.getByRole('button', { name: 'Active' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('shows the archived-tenants toggle set to All when shouldShowArchived is true', () => {
    render(<TenantsView tenants={[tenant]} shouldShowArchived={true} />);

    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
