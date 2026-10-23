import { ICONS } from '@blog/config';
import { usePathname } from '@platform/i18n/navigation';
import {
  renderWithIntl,
  screen,
  within,
} from '@platform/testing/custom-render';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
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

const THIS_MILESTONE = 'this milestone';
const TENANT_SECTION_LABEL = 'Tenant · acme';
const LOOK_AND_VOICE_SHIP_SOON = 'Look and Voice ship soon.';
const ARIA_CURRENT = 'aria-current';
const TENANT_SWITCHER = 'Tenant switcher';

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
                badge: { label: THIS_MILESTONE, tone: 'neutral' },
              },
            ],
          },
          {
            label: TENANT_SECTION_LABEL,
            items: [],
            note: LOOK_AND_VOICE_SHIP_SOON,
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
    expect(within(tenantsLink).getByText(THIS_MILESTONE)).toBeVisible();
    expect(within(menu).getByText(LOOK_AND_VOICE_SHIP_SOON)).toBeVisible();
  });

  it('marks only the item matching the current pathname active', async () => {
    setPathname(`/tenants/${MOCK_TENANT_ID}/look`);
    render(
      <TopbarNavMenu
        sections={[
          {
            label: TENANT_SECTION_LABEL,
            items: [
              {
                label: 'Look',
                icon: ICONS.PALETTE,
                href: `/tenants/${MOCK_TENANT_ID}/look`,
              },
              {
                label: 'Voice',
                icon: ICONS.QUOTE,
                href: `/tenants/${MOCK_TENANT_ID}/voice`,
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
    ).toHaveAttribute(ARIA_CURRENT, 'page');
    expect(
      within(menu).getByRole('menuitem', { name: 'Voice' }),
    ).not.toHaveAttribute(ARIA_CURRENT);
  });

  it('renders an item with no href as an inert row that is never marked active', async () => {
    setPathname(`/tenants/${MOCK_TENANT_ID}/domain`);
    render(
      <TopbarNavMenu
        sections={[
          {
            label: TENANT_SECTION_LABEL,
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
      ARIA_CURRENT,
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

    expect(within(menu).getByText(TENANT_SWITCHER)).toBeVisible();
    expect(text.indexOf(TENANT_SWITCHER)).toBeLessThan(
      text.indexOf('Platform'),
    );
  });

  it('renders no switcher slot when none is provided', async () => {
    render(<TopbarNavMenu sections={PLATFORM_TENANTS_SECTION} />);

    await user.click(screen.getByRole('button', { name: 'Menu' }));
    await screen.findByRole('menu');

    expect(screen.queryByText(TENANT_SWITCHER)).not.toBeInTheDocument();
  });
});
