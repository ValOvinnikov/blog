import { renderWithIntl, screen, within } from '@admin/testing/custom-render';
import { ICONS } from '@blog/config';
import userEvent from '@testing-library/user-event';
import type { ComponentPropsWithoutRef } from 'react';

import { AdminShell } from './admin-shell';

// `Topbar`'s nav menu (rendered here since `sections` is always passed) and
// the desktop `Sidebar` both resolve active links via `@admin/i18n/navigation`
// — mocked the same way as `sidebar.test.tsx`/`topbar-nav-menu.test.tsx`.
vi.mock('@admin/i18n/navigation', () => ({
  usePathname: () => '/',
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

const render = renderWithIntl;

describe(AdminShell, () => {
  it('renders the sidebar, topbar and page content together', () => {
    render(
      <AdminShell
        sections={[
          {
            label: 'Platform section',
            items: [{ label: 'Tenants', icon: ICONS.GRID, href: '/tenants' }],
          },
        ]}
        crumb="Platform"
        roleLabel="ADMIN"
      >
        <p>Tenants page</p>
      </AdminShell>,
    );

    expect(screen.getByRole('link', { name: 'Tenants' })).toBeVisible();
    expect(screen.getByText('Platform section')).toBeVisible();
    expect(screen.getByText('Platform', { selector: 'p' })).toBeVisible();
    expect(screen.getByText('ADMIN')).toBeVisible();
    expect(screen.getByText('Tenants page')).toBeVisible();
  });

  it('also threads sections and switcher into the Topbar nav menu, not just the desktop Sidebar', async () => {
    const user = userEvent.setup();
    render(
      <AdminShell
        sections={[
          {
            label: 'Platform section',
            items: [{ label: 'Tenants', icon: ICONS.GRID, href: '/tenants' }],
          },
        ]}
        switcher={<div>Tenant switcher</div>}
        crumb="Platform"
        roleLabel="ADMIN"
      >
        <p>Tenants page</p>
      </AdminShell>,
    );

    const trigger = screen.getByRole('button', { name: 'Menu' });
    expect(trigger).toBeVisible();

    await user.click(trigger);
    const menu = await screen.findByRole('menu');
    expect(
      within(menu).getByRole('menuitem', { name: 'Tenants' }),
    ).toBeVisible();
    expect(within(menu).getByText('Tenant switcher')).toBeVisible();
  });
});
