import { ICONS } from '@blog/config';
import {
  renderWithIntl,
  screen,
  within,
} from '@platform/testing/custom-render';
import userEvent from '@testing-library/user-event';
import { useSelectedLayoutSegment } from 'next/navigation';
import type { ComponentPropsWithoutRef } from 'react';

import { AdminShell } from './admin-shell';

// `Topbar`'s nav menu (rendered here since `sections` is always passed) and
// the desktop `Sidebar` both resolve active links via `@platform/i18n/navigation`
// — mocked the same way as `sidebar.test.tsx`/`topbar-nav-menu.test.tsx`.
vi.mock('@platform/i18n/navigation', () => ({
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

const roleChip = { name: 'Val Ovinnikov', role: 'ADMIN', scope: 'Platform' };

describe(AdminShell, () => {
  afterEach(() => {
    vi.mocked(useSelectedLayoutSegment).mockReturnValue(null);
  });

  it('renders the sidebar, topbar and page content together', () => {
    render(
      <AdminShell
        sections={[
          {
            label: 'Platform section',
            items: [{ label: 'Tenants', icon: ICONS.GRID, href: '/tenants' }],
          },
        ]}
        crumb={<p>Platform</p>}
        roleChip={roleChip}
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
        crumb={<p>Platform</p>}
        roleChip={roleChip}
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

  it('still renders the sidebar, topbar and page content on the studio route, in full-bleed mode', () => {
    vi.mocked(useSelectedLayoutSegment).mockReturnValue('studio');

    render(
      <AdminShell
        sections={[
          {
            label: 'Platform section',
            items: [{ label: 'Tenants', icon: ICONS.GRID, href: '/tenants' }],
          },
        ]}
        crumb={<p>Platform</p>}
        roleChip={roleChip}
      >
        <p>Studio content</p>
      </AdminShell>,
    );

    expect(screen.getByRole('link', { name: 'Tenants' })).toBeVisible();
    expect(screen.getByText('Studio content')).toBeVisible();
  });

  it('seeds the sidebar as collapsed when isSidebarInitiallyCollapsed is true', () => {
    render(
      <AdminShell
        sections={[
          {
            label: 'Platform section',
            items: [{ label: 'Tenants', icon: ICONS.GRID, href: '/tenants' }],
          },
        ]}
        isSidebarInitiallyCollapsed={true}
        crumb={<p>Platform</p>}
        roleChip={roleChip}
      >
        <p>Tenants page</p>
      </AdminShell>,
    );

    expect(
      screen.getByRole('button', { name: 'Expand sidebar' }),
    ).toHaveAttribute('aria-expanded', 'false');
    // The nav link's accessible name survives the collapse.
    expect(screen.getByRole('link', { name: 'Tenants' })).toBeVisible();
  });
});
