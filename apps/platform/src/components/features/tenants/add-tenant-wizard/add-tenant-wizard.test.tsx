import { renderWithIntl, screen } from '@platform/testing/custom-render';

import { AddTenantWizard } from './add-tenant-wizard';

const render = renderWithIntl;

vi.mock('@platform/server/tenants/create-tenant-action', () => ({
  createTenantAction: vi.fn(),
}));

describe(AddTenantWizard, () => {
  it('renders the page H1 and demotes Tenant details to the step-1 card heading', () => {
    render(<AddTenantWizard />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Add tenant' }),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Tenant details' }),
    ).toBeVisible();
  });

  it('renders the five-step rail with Details as the active step', () => {
    render(<AddTenantWizard />);

    const rail = screen.getByRole('navigation', {
      name: 'Provisioning steps',
    });
    const items = screen.getAllByRole('listitem');

    expect(items).toHaveLength(5);
    expect(items[0]).toHaveAttribute('aria-current', 'step');
    expect(rail).toHaveTextContent('Details');
    expect(rail).toHaveTextContent('Sanity project');
    expect(rail).toHaveTextContent('Seed content');
    expect(rail).toHaveTextContent('Registry rows');
    expect(rail).toHaveTextContent('Map domain');
  });

  it("renders the Details form's fields", () => {
    render(<AddTenantWizard />);

    expect(screen.getByRole('textbox', { name: 'Tenant name' })).toBeVisible();
  });
});
