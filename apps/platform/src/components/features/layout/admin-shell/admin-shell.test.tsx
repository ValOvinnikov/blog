import { ICONS } from '@blog/config';
import { ADMIN_ROLE } from '@blog/db/constants';
import {
  renderWithIntl,
  screen,
  within,
} from '@platform/testing/custom-render';
import userEvent from '@testing-library/user-event';
import { useSelectedLayoutSegment } from 'next/navigation';

import { AdminShell } from './admin-shell';

vi.mock('@platform/i18n/navigation');
vi.mock('@platform/server/auth/sign-out-action');

const render = renderWithIntl;

const roleChip = {
  name: 'Jane Doe',
  role: ADMIN_ROLE.ADMIN,
  scope: 'Platform',
};

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
    expect(screen.getByText('Admin · Platform')).toBeVisible();
    expect(screen.getByText('Tenants page')).toBeVisible();
  });

  it('threads sections and switcher into the Topbar nav menu as well as the Sidebar', async () => {
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

  it('renders the sidebar, topbar and page content full-bleed on the studio route', () => {
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
    expect(screen.getByRole('link', { name: 'Tenants' })).toBeVisible();
  });
});
