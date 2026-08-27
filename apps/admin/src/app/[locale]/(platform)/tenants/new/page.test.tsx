import { renderWithIntl, screen } from '@admin/testing/custom-render';

import NewTenantPage from './page';

const render = renderWithIntl;

vi.mock('@admin/server/tenants/create-tenant-action', () => ({
  createTenantAction: vi.fn(),
}));

describe(NewTenantPage, () => {
  it('renders the Add tenant wizard with the Details step form', () => {
    render(<NewTenantPage />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Add tenant' }),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', { name: 'Tenant details' }),
    ).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Tenant name' })).toBeVisible();
  });
});
