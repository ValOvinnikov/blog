import { renderWithIntl, screen } from '@platform/testing/custom-render';

import NewTenantPage from './page';

const render = renderWithIntl;

vi.mock('@platform/utils/env/env');

vi.mock('@platform/server/tenants/create-tenant-action', () => ({
  createTenantAction: vi.fn(),
}));

describe(NewTenantPage, () => {
  it('renders the Add tenant wizard with the Details step form', () => {
    render(<NewTenantPage />);

    const pageHeading = screen.getByRole('heading', {
      level: 1,
      name: 'Add tenant',
    });
    const cardHeading = screen.getByRole('heading', {
      level: 2,
      name: 'Tenant details',
    });
    const nameInput = screen.getByRole('textbox', { name: 'Tenant name' });

    expect(pageHeading).toBeVisible();
    expect(cardHeading).toBeVisible();
    expect(nameInput).toBeVisible();
  });
});
