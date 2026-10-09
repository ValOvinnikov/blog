import { ICONS } from '@blog/config';
import { SidebarCollapseProvider } from '@platform/components/features/layout/sidebar-collapse-provider';
import { usePathname } from '@platform/i18n/navigation';
import {
  renderWithIntl,
  screen,
  within,
} from '@platform/testing/custom-render';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';

import { Sidebar } from './sidebar';

vi.mock('@platform/i18n/navigation');

const usePathnameMock = vi.mocked(usePathname);

const render = (ui: ReactNode) =>
  renderWithIntl(
    <SidebarCollapseProvider isInitiallyCollapsed={false}>
      {ui}
    </SidebarCollapseProvider>,
  );

const setPathname = (pathname: string) => {
  usePathnameMock.mockReturnValue(pathname);
};

describe(`<${Sidebar.name}/>`, () => {
  beforeEach(() => {
    setPathname('/');
  });

  it('renders each section label and its nav links', () => {
    render(
      <Sidebar
        sections={[
          {
            label: 'Platform',
            items: [{ label: 'Tenants', icon: ICONS.GRID, href: '/tenants' }],
          },
        ]}
      />,
    );

    expect(screen.getByText('Platform')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Tenants' })).toHaveAttribute(
      'href',
      '/tenants',
    );
  });

  it('renders the note instead of a dead link when a section has no items yet', () => {
    render(
      <Sidebar
        sections={[
          {
            label: 'Tenant · acme',
            items: [],
            note: 'Look and Voice ship soon.',
          },
        ]}
      />,
    );

    expect(screen.getByText('Look and Voice ship soon.')).toBeVisible();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders the switcher slot when provided', () => {
    render(<Sidebar sections={[]} switcher={<div>Tenant switcher</div>} />);

    expect(screen.getByText('Tenant switcher')).toBeVisible();
  });

  it('renders the brand block with the Valstack mark and name', () => {
    render(<Sidebar sections={[]} />);

    expect(screen.getAllByText('Valstack').length).toBeGreaterThan(0);
    expect(screen.getByText('admin')).toBeVisible();
  });

  it('carries its badge as visible text', () => {
    render(
      <Sidebar
        sections={[
          {
            label: 'Tenant · acme',
            items: [
              {
                label: 'Look',
                icon: ICONS.PALETTE,
                href: '/tenants/tenant-1/look',
                badge: { label: 'this milestone', tone: 'neutral' },
              },
            ],
          },
        ]}
      />,
    );

    const link = screen.getByRole('link', { name: /Look/ });
    expect(within(link).getByText('this milestone')).toBeVisible();
  });

  it('marks the item matching the current pathname active, and no other', () => {
    setPathname('/tenants/tenant-1/look');

    render(
      <Sidebar
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

    expect(screen.getByRole('link', { name: 'Look' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Voice' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it.each([
    {
      description:
        'marks Studio active when its own route is open, same as any other nav item',
      pathname: '/tenants/tenant-1/studio',
      items: [
        {
          label: 'Studio',
          icon: ICONS.STUDIO,
          href: '/tenants/tenant-1/studio',
        },
        { label: 'Look', icon: ICONS.PALETTE, href: '/tenants/tenant-1/look' },
      ],
      activeLabel: 'Studio',
      inactiveLabel: 'Look',
    },
    {
      description:
        'switches which item is active when the route changes — the case a shared href could not express',
      pathname: '/tenants/tenant-1/voice',
      items: [
        { label: 'Look', icon: ICONS.PALETTE, href: '/tenants/tenant-1/look' },
        { label: 'Voice', icon: ICONS.QUOTE, href: '/tenants/tenant-1/voice' },
      ],
      activeLabel: 'Voice',
      inactiveLabel: 'Look',
    },
  ])('$description', ({ pathname, items, activeLabel, inactiveLabel }) => {
    setPathname(pathname);

    render(<Sidebar sections={[{ label: 'Tenant · acme', items }]} />);

    expect(screen.getByRole('link', { name: activeLabel })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(
      screen.getByRole('link', { name: inactiveLabel }),
    ).not.toHaveAttribute('aria-current');
  });

  it('renders an unbuilt destination as an inert, never-active row with its badge text', () => {
    setPathname('/tenants/tenant-1/domain');

    render(
      <Sidebar
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

    expect(
      screen.queryByRole('link', { name: /Domain/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Domain')).toBeVisible();
    expect(screen.getByText('later')).toBeVisible();
    expect(screen.queryByText('Domain')).not.toHaveAttribute('aria-current');
  });

  it("renders an inert item's disabled reason as visible text", () => {
    render(
      <Sidebar
        sections={[
          {
            label: 'Platform',
            items: [
              {
                label: 'Add tenant',
                icon: ICONS.PLUS,
                badge: { label: 'deferred', tone: 'warn' },
                disabledReason: "Provisioning isn't available yet.",
              },
            ],
          },
        ]}
      />,
    );

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText("Provisioning isn't available yet.")).toBeVisible();
  });

  it('names its collapse toggle for its action, flipping name and aria-expanded', async () => {
    const user = userEvent.setup();
    render(<Sidebar sections={[]} />);

    const toggle = screen.getByRole('button', { name: 'Collapse sidebar' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await user.click(toggle);

    expect(
      screen.getByRole('button', { name: 'Expand sidebar' }),
    ).toHaveAttribute('aria-expanded', 'false');
  });

  it('keeps a nav link reachable by its name when the sidebar starts collapsed', () => {
    renderWithIntl(
      <SidebarCollapseProvider isInitiallyCollapsed={true}>
        <Sidebar
          sections={[
            {
              label: 'Platform',
              items: [{ label: 'Tenants', icon: ICONS.GRID, href: '/tenants' }],
            },
          ]}
        />
      </SidebarCollapseProvider>,
    );

    const link = screen.getByRole('link', { name: 'Tenants' });
    expect(link).toHaveAttribute('href', '/tenants');
    expect(link).toHaveAttribute('title', 'Tenants');
  });

  it('keeps an inert row named and its badge announced when the sidebar starts collapsed', () => {
    renderWithIntl(
      <SidebarCollapseProvider isInitiallyCollapsed={true}>
        <Sidebar
          sections={[
            {
              label: 'Tenant · acme',
              items: [
                {
                  label: 'Analytics',
                  icon: ICONS.GLOBE,
                  badge: { label: 'Coming soon', tone: 'neutral' },
                },
              ],
            },
          ]}
        />
      </SidebarCollapseProvider>,
    );

    expect(screen.getByTitle('Analytics')).toHaveTextContent(
      'AnalyticsComing soon',
    );
  });
});
