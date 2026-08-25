import { renderWithIntl, screen, within } from '@admin/testing/custom-render';
import { ICONS } from '@blog/config';
import userEvent from '@testing-library/user-event';
import type { ComponentPropsWithoutRef } from 'react';

import { TopbarNavMenu } from './topbar-nav-menu';

const { usePathnameMock } = vi.hoisted(() => ({
  usePathnameMock: vi.fn(),
}));

// `TopbarNavMenu` resolves each link's active state via `@admin/i18n/navigation`
// (next-intl's locale-aware `usePathname`) and links through its `Link`, not
// plain `next/link`/`next/navigation` — mocking the wrong module here would
// let a broken import ship unnoticed (see `sidebar.test.tsx`'s identical mock).
vi.mock('@admin/i18n/navigation', () => ({
  usePathname: usePathnameMock,
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

const setPathname = (pathname: string) => {
  usePathnameMock.mockReturnValue(pathname);
};

describe(TopbarNavMenu, () => {
  beforeEach(() => {
    setPathname('/');
  });

  it('renders a closed, icon-only trigger by default', () => {
    render(<TopbarNavMenu sections={[]} />);

    expect(screen.getByRole('button', { name: 'Menu' })).toBeVisible();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('opens the popup on click, showing sections, items, badges and notes', async () => {
    const user = userEvent.setup();
    render(
      <TopbarNavMenu
        sections={[
          {
            label: 'Platform',
            items: [
              {
                label: 'Tenants',
                icon: ICONS.GRID,
                href: '/tenants',
                badge: { label: 'this milestone', tone: 'neutral' },
              },
            ],
          },
          {
            label: 'Tenant · acme',
            items: [],
            note: 'Look and Voice ship soon.',
          },
        ]}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Menu' }));

    const menu = await screen.findByRole('menu');
    const tenantsLink = within(menu).getByRole('menuitem', {
      name: /Tenants/,
    });
    expect(tenantsLink).toHaveAttribute('href', '/tenants');
    expect(within(tenantsLink).getByText('this milestone')).toBeVisible();
    expect(within(menu).getByText('Look and Voice ship soon.')).toBeVisible();
  });

  it('marks only the item matching the current pathname active', async () => {
    setPathname('/t/acme/look');
    const user = userEvent.setup();
    render(
      <TopbarNavMenu
        sections={[
          {
            label: 'Tenant · acme',
            items: [
              { label: 'Look', icon: ICONS.PALETTE, href: '/t/acme/look' },
              { label: 'Voice', icon: ICONS.QUOTE, href: '/t/acme/voice' },
            ],
          },
        ]}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Menu' }));
    const menu = await screen.findByRole('menu');

    expect(
      within(menu).getByRole('menuitem', { name: 'Look' }),
    ).toHaveAttribute('aria-current', 'page');
    expect(
      within(menu).getByRole('menuitem', { name: 'Voice' }),
    ).not.toHaveAttribute('aria-current');
  });

  it('renders an item with no href as an inert, non-interactive row that is never marked active', async () => {
    setPathname('/t/acme/domain');
    const user = userEvent.setup();
    render(
      <TopbarNavMenu
        sections={[
          {
            label: 'Tenant · acme',
            items: [
              {
                label: 'Domain',
                icon: ICONS.GLOBE,
                badge: { label: 'later', tone: 'warn' },
              },
            ],
          },
        ]}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Menu' }));
    const menu = await screen.findByRole('menu');

    expect(
      within(menu).queryByRole('menuitem', { name: /Domain/ }),
    ).not.toBeInTheDocument();
    expect(within(menu).getByText('Domain')).toBeVisible();
    expect(within(menu).getByText('later')).toBeVisible();
    expect(within(menu).queryByText('Domain')).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('closes the popup after clicking a link item', async () => {
    const user = userEvent.setup();
    render(
      <TopbarNavMenu
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
    await user.click(within(menu).getByRole('menuitem', { name: 'Tenants' }));

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('renders the switcher slot above the nav sections when provided', async () => {
    const user = userEvent.setup();
    render(
      <TopbarNavMenu
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

  it('renders no switcher slot when none is provided', async () => {
    const user = userEvent.setup();
    render(
      <TopbarNavMenu
        sections={[
          {
            label: 'Platform',
            items: [{ label: 'Tenants', icon: ICONS.GRID, href: '/tenants' }],
          },
        ]}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Menu' }));
    await screen.findByRole('menu');

    expect(screen.queryByText('Tenant switcher')).not.toBeInTheDocument();
  });
});
