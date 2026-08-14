import { renderWithIntl, screen } from '@admin/testing/custom-render';

import { TenantOverview } from './tenant-overview';

const render = renderWithIntl;

describe(TenantOverview, () => {
  it('renders the routed tenant slug as the heading', () => {
    render(<TenantOverview tenantSlug="acme" />);

    expect(screen.getByRole('heading', { name: 'acme' })).toBeVisible();
  });
});
