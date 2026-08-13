import type { TTenant } from '@blog/db/schema/tenants';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TenantSwitcher } from './tenant-switcher';

const tenant: TTenant = {
  id: 'tenant-1',
  slug: 'acme',
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
    render(
      <TenantSwitcher
        tenants={[tenant]}
        activeTenantId="tenant-1"
        ariaLabel="Switch tenant"
      />,
    );

    expect(screen.getByRole('button', { name: /acme/i })).toHaveTextContent(
      'acme.example.com',
    );
  });

  it('opens a menu carrying the caller-supplied ariaLabel, listing every tenant the user can switch into and linking to its route', async () => {
    const user = userEvent.setup();
    render(
      <TenantSwitcher
        tenants={[tenant]}
        activeTenantId="tenant-1"
        ariaLabel="Switch tenant"
      />,
    );

    await user.click(screen.getByRole('button', { name: /acme/i }));

    const menu = await screen.findByRole('menu');
    expect(menu).toHaveAttribute('aria-label', 'Switch tenant');
    const link = screen.getByRole('menuitem', { name: /acme/i });
    expect(link).toHaveAttribute('href', '/t/acme');
  });
});
