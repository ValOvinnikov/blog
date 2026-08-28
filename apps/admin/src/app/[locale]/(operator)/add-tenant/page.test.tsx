import { renderWithIntl, screen } from '@admin/testing/custom-render';

import AddTenantPage from './page';

const render = renderWithIntl;

vi.mock('@admin/server/tenants/create-tenant-action', () => ({
  createTenantAction: vi.fn(),
}));

describe(AddTenantPage, () => {
  it('renders the Details step form', () => {
    render(<AddTenantPage />);

    expect(
      screen.getByRole('heading', { name: 'Tenant details' }),
    ).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Tenant name' })).toBeVisible();
  });
});
