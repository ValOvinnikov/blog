import { renderWithIntl, screen } from '@admin/testing/custom-render';
import { makeTenant } from '@admin/testing/tenants/fixtures';
import { TENANT_PLAN } from '@blog/config';

import { TenantDetailsPanel } from './tenant-details-panel';

const render = renderWithIntl;

describe(TenantDetailsPanel, () => {
  it('renders every tenant detail read-only', () => {
    const tenant = makeTenant({
      name: 'Acme Inc.',
      slug: 'acme',
      primaryDomain: 'acme.example.com',
      plan: TENANT_PLAN.GROWTH,
      locale: 'EN',
    });
    render(<TenantDetailsPanel tenant={tenant} />);

    expect(screen.getByText('Tenant details')).toBeVisible();
    expect(screen.getByText('Acme Inc.')).toBeVisible();
    expect(screen.getByText('acme')).toBeVisible();
    expect(screen.getByText('acme.example.com')).toBeVisible();
    expect(screen.getByText('Growth')).toBeVisible();
    expect(screen.getByText('EN')).toBeVisible();
  });

  it('renders no editable controls', () => {
    const tenant = makeTenant();
    render(<TenantDetailsPanel tenant={tenant} />);

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
