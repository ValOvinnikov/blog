import { CORE_PROVISIONING_STEPS } from '@blog/db/constants';
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

  it('renders a rail item for Details plus every core provisioning step, with Details active', () => {
    render(<AddTenantWizard />);

    const rail = screen.getByRole('navigation', {
      name: 'Provisioning steps',
    });
    const items = screen.getAllByRole('listitem');

    expect(items).toHaveLength(CORE_PROVISIONING_STEPS.length + 1);
    expect(items[0]).toHaveAttribute('aria-current', 'step');
    expect(rail).toHaveTextContent('Details');
    expect(rail).toHaveTextContent('Create workspace');
    expect(rail).toHaveTextContent('Seed content');
    expect(rail).toHaveTextContent('Issue read credentials');
    expect(rail).toHaveTextContent('Connect domain');
    expect(rail).toHaveTextContent('Wire up CMS to website');
    expect(rail).toHaveTextContent('Confirm content is ready');
  });

  it("renders the Details form's fields", () => {
    render(<AddTenantWizard />);

    expect(screen.getByRole('textbox', { name: 'Tenant name' })).toBeVisible();
  });
});
