import type { TTenant } from '@blog/db/schema/tenants';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TenantSwitcher } from './tenant-switcher';

const tenant: TTenant = {
  id: 'tenant-1',
  slug: 'acme',
  name: 'Acme Inc.',
  primaryDomain: 'acme.example.com',
  sanityProjectId: 'proj-1',
  sanityDataset: 'production',
  locale: 'en',
  plan: 'FREE',
  status: 'ACTIVE',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe(TenantSwitcher, () => {
  it('shows the active tenant on the trigger', () => {
    render(<TenantSwitcher tenants={[tenant]} activeTenantId="tenant-1" />);

    expect(
      screen.getByRole('button', { name: /acme inc\./i }),
    ).toHaveTextContent('acme.example.com');
  });

  it('opens a menu whose accessible name is the active tenant (from the trigger), listing every tenant the user can switch into and linking to its route', async () => {
    const user = userEvent.setup();
    render(<TenantSwitcher tenants={[tenant]} activeTenantId="tenant-1" />);

    await user.click(screen.getByRole('button', { name: /acme inc\./i }));

    const menu = await screen.findByRole('menu', { name: /acme inc\./i });
    const link = within(menu).getByRole('menuitem', { name: /acme inc\./i });
    expect(link).toHaveAttribute('href', '/t/acme');
  });

  it('links each tenant through a caller-supplied hrefFor instead of the default /t/{slug} route', async () => {
    const user = userEvent.setup();
    render(
      <TenantSwitcher
        tenants={[tenant]}
        activeTenantId="tenant-1"
        hrefFor={(t) => `/dashboard/select-tenant?tenantId=${t.id}`}
      />,
    );

    await user.click(screen.getByRole('button', { name: /acme inc\./i }));

    const menu = await screen.findByRole('menu', { name: /acme inc\./i });
    const link = within(menu).getByRole('menuitem', { name: /acme inc\./i });
    expect(link).toHaveAttribute(
      'href',
      '/dashboard/select-tenant?tenantId=tenant-1',
    );
  });
});
