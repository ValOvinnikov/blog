import { render, screen } from '@testing-library/react';

import { TenantOverview } from './tenant-overview';

describe(TenantOverview, () => {
  it('renders the routed tenant slug as the heading', () => {
    render(<TenantOverview tenantSlug="acme" />);

    expect(screen.getByRole('heading', { name: 'acme' })).toBeVisible();
  });
});
