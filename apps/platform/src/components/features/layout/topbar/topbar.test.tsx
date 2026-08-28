import { ICONS } from '@blog/config';
import {
  renderWithIntl,
  screen,
  within,
} from '@platform/testing/custom-render';
import userEvent from '@testing-library/user-event';
import type { ComponentPropsWithoutRef } from 'react';

import { Topbar } from './topbar';

// `TopbarNavMenu` (rendered when `sections` is passed) resolves its active
// link via `@platform/i18n/navigation`'s `usePathname` and links through its
// `Link` — mocked the same way as `sidebar.test.tsx`/`topbar-nav-menu.test.tsx`.
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

describe(Topbar, () => {
  it('renders the given crumb node and the role chip', () => {
    render(<Topbar crumb={<p>Platform</p>} roleChip={roleChip} />);

    expect(screen.getByText('Platform')).toBeVisible();
    expect(screen.getByText('ADMIN')).toBeVisible();
    expect(screen.getByText('· Platform')).toBeVisible();
  });

  it('renders no nav menu trigger when no sections are passed', () => {
    render(<Topbar crumb={<p>Platform</p>} roleChip={roleChip} />);

    expect(
      screen.queryByRole('button', { name: 'Menu' }),
    ).not.toBeInTheDocument();
  });

  it('renders a nav menu trigger that opens the passed sections when sections are provided', async () => {
    const user = userEvent.setup();
    render(
      <Topbar
        crumb={<p>Platform</p>}
        roleChip={roleChip}
        sections={[
          {
            label: 'Platform',
            items: [{ label: 'Tenants', icon: ICONS.GRID, href: '/tenants' }],
          },
        ]}
      />,
    );

    const trigger = screen.getByRole('button', { name: 'Menu' });
    expect(trigger).toBeVisible();

    await user.click(trigger);
    const menu = await screen.findByRole('menu');
    expect(
      within(menu).getByRole('menuitem', { name: 'Tenants' }),
    ).toBeVisible();
  });

  it('renders the switcher slot above the section items inside the opened nav menu', async () => {
    const user = userEvent.setup();
    render(
      <Topbar
        crumb={<p>Platform</p>}
        roleChip={roleChip}
        switcher={<div>Tenant switcher</div>}
        sections={[
          {
            label: 'Platform',
            items: [{ label: 'Tenants', icon: ICONS.GRID, href: '/tenants' }],
          },
        ]}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Menu' }));
    const menu = await screen.findByRole('menu');
    const text = menu.textContent ?? '';

    expect(within(menu).getByText('Tenant switcher')).toBeVisible();
    expect(text.indexOf('Tenant switcher')).toBeLessThan(
      text.indexOf('Platform'),
    );
  });
});
