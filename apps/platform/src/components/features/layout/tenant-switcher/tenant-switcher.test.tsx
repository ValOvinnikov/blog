import { customRender, screen, within } from '@platform/testing/custom-render';
import {
  makeReadyTenant,
  makeTenant,
} from '@platform/testing/tenants/fixtures';
import userEvent from '@testing-library/user-event';
import type { ComponentPropsWithoutRef } from 'react';

import { TenantSwitcher } from './tenant-switcher';

vi.mock('@platform/i18n/navigation', () => ({
  Link: ({
    href,
    children,
    ...rest
  }: ComponentPropsWithoutRef<'a'> & { href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const tenant = makeReadyTenant();

const setup = customRender(TenantSwitcher, {
  tenants: [tenant],
  activeTenantId: 'tenant-1',
});

describe(`<${TenantSwitcher.name}/>`, () => {
  it('shows the active tenant on the trigger', () => {
    setup();

    expect(
      screen.getByRole('button', { name: /acme inc\./i }),
    ).toHaveTextContent('acme.example.com');
  });

  it('opens a menu whose accessible name is the active tenant (from the trigger), listing every tenant the user can switch into and linking to its route', async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole('button', { name: /acme inc\./i }));

    const menu = await screen.findByRole('menu', { name: /acme inc\./i });
    const link = within(menu).getByRole('menuitem', { name: /acme inc\./i });
    expect(link).toHaveAttribute('href', '/tenants/tenant-1');
  });

  it('links each tenant through a caller-supplied hrefFor instead of the default /tenants/{id} route', async () => {
    const user = userEvent.setup();
    setup({
      hrefFor: (t) => `/dashboard/select-tenant?tenantId=${t.id}`,
    });

    await user.click(screen.getByRole('button', { name: /acme inc\./i }));

    const menu = await screen.findByRole('menu', { name: /acme inc\./i });
    const link = within(menu).getByRole('menuitem', { name: /acme inc\./i });
    expect(link).toHaveAttribute(
      'href',
      '/dashboard/select-tenant?tenantId=tenant-1',
    );
  });

  it('marks an archived tenant in the menu, as part of its accessible name, and leaves a non-archived one unmarked', async () => {
    const user = userEvent.setup();
    const archivedTenant = makeTenant({
      id: 'tenant-2',
      name: 'Globex Corp',
      primaryDomain: 'globex.example.com',
      deprovisionedAt: new Date('2026-02-01T00:00:00.000Z'),
    });
    setup({ tenants: [tenant, archivedTenant] });

    await user.click(screen.getByRole('button', { name: /acme inc\./i }));

    const menu = await screen.findByRole('menu', { name: /acme inc\./i });
    expect(
      within(menu).getByRole('menuitem', { name: /acme inc\./i }),
    ).not.toHaveAccessibleName(/archived/i);
    expect(
      within(menu).getByRole('menuitem', { name: /globex corp.*archived/i }),
    ).toBeVisible();
  });

  it('shows the archived marker on the trigger when the active tenant is archived', () => {
    const archivedTenant = makeTenant({
      id: 'tenant-2',
      name: 'Globex Corp',
      primaryDomain: 'globex.example.com',
      deprovisionedAt: new Date('2026-02-01T00:00:00.000Z'),
    });
    setup({ tenants: [tenant, archivedTenant], activeTenantId: 'tenant-2' });

    expect(
      screen.getByRole('button', { name: /globex corp.*archived/i }),
    ).toBeVisible();
  });
});
