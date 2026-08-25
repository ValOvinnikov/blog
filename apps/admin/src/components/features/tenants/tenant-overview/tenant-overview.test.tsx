import { renderWithIntl, screen } from '@admin/testing/custom-render';

import { TenantOverview } from './tenant-overview';

const render = renderWithIntl;

describe(TenantOverview, () => {
  it('renders the tenant name as the heading', () => {
    render(<TenantOverview tenantName="Acme Inc." />);

    expect(screen.getByRole('heading', { name: 'Acme Inc.' })).toBeVisible();
  });
});
