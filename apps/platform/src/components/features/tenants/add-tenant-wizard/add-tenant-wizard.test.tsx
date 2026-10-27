import { CORE_PROVISIONING_STEPS } from '@blog/db/constants';
import { customRender, screen } from '@platform/testing/custom-render';
import { MOCK_TENANT_ROOT_DOMAIN } from '@platform/testing/tenants/fixtures';

import { AddTenantWizard } from './add-tenant-wizard';

vi.mock('@platform/server/tenants/create-tenant-action', () => ({
  createTenantAction: vi.fn(),
}));

const setup = customRender(AddTenantWizard, {
  rootDomain: MOCK_TENANT_ROOT_DOMAIN,
});

describe(`<${AddTenantWizard.name}/>`, () => {
  beforeEach(() => {
    setup();
  });

  it('puts the page title above the Tenant details step heading', () => {
    const pageHeading = screen.getByRole('heading', {
      level: 1,
      name: 'Add tenant',
    });
    const cardHeading = screen.getByRole('heading', {
      level: 2,
      name: 'Tenant details',
    });

    expect(pageHeading).toBeVisible();
    expect(cardHeading).toBeVisible();
  });

  it('lists Details and every core provisioning step, with Details active', () => {
    const rail = screen.getByRole('list', {
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

  it('shows the tenant name field in the Details form', () => {
    const nameInput = screen.getByRole('textbox', { name: 'Tenant name' });

    expect(nameInput).toBeVisible();
  });
});
