import { ICONS } from '@blog/config';
import { usePathname } from '@platform/i18n/navigation';
import {
  renderWithIntl,
  screen,
  within,
} from '@platform/testing/custom-render';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { TopbarNavMenu } from './topbar-nav-menu';

vi.mock('@platform/i18n/navigation');

const usePathnameMock = vi.mocked(usePathname);

const render = renderWithIntl;

const setPathname = (pathname: string) => {
  usePathnameMock.mockReturnValue(pathname);
};

const PLATFORM_TENANTS_SECTION = [
  {
    label: 'Platform',
    items: [{ label: 'Tenants', icon: ICONS.GRID, href: '/tenants' }],
  },
];

describe(`<${TopbarNavMenu.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    setPathname('/');
  });

  it('renders a closed, icon-only trigger by default', () => {
    render(<TopbarNavMenu sections={[]} />);

    expect(screen.getByRole('button', { name: 'Menu' })).toBeVisible();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('opens the popup on click, showing sections, items, badges and notes', async () => {
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
    setPathname('/tenants/tenant-1/look');
    render(
      <TopbarNavMenu
        sections={[
          {
            label: 'Tenant · acme',
            items: [
              {
                label: 'Look',
                icon: ICONS.PALETTE,
                href: '/tenants/tenant-1/look',
              },
              {
                label: 'Voice',
                icon: ICONS.QUOTE,
                href: '/tenants/tenant-1/voice',
              },
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

  it('renders an item with no href as an inert row that is never marked active', async () => {
    setPathname('/tenants/tenant-1/domain');
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
    render(<TopbarNavMenu sections={PLATFORM_TENANTS_SECTION} />);

    await user.click(screen.getByRole('button', { name: 'Menu' }));
    const menu = await screen.findByRole('menu');
    await user.click(within(menu).getByRole('menuitem', { name: 'Tenants' }));

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('renders the switcher slot above the nav sections when provided', async () => {
    render(
      <TopbarNavMenu
        switcher={<div>Tenant switcher</div>}
        sections={PLATFORM_TENANTS_SECTION}
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
    render(<TopbarNavMenu sections={PLATFORM_TENANTS_SECTION} />);

    await user.click(screen.getByRole('button', { name: 'Menu' }));
    await screen.findByRole('menu');

    expect(screen.queryByText('Tenant switcher')).not.toBeInTheDocument();
  });
});
