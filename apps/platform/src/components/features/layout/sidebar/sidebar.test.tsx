import { ICONS } from '@blog/config';
import { SidebarCollapseProvider } from '@platform/components/features/layout/sidebar-collapse-provider';
import { usePathname } from '@platform/i18n/navigation';
import {
  renderWithIntl,
  screen,
  within,
} from '@platform/testing/custom-render';
import { TENANT_ID } from '@platform/testing/tenants/fixtures';
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

const TENANT_SECTION_LABEL = 'Tenant · acme';
const LOOK_AND_VOICE_SHIP_SOON = 'Look and Voice ship soon.';
const THIS_MILESTONE = 'this milestone';
const ARIA_CURRENT = 'aria-current';
const PROVISIONING_ISN_T_AVAILABLE_YET = "Provisioning isn't available yet.";
const ARIA_EXPANDED = 'aria-expanded';

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
            label: TENANT_SECTION_LABEL,
            items: [],
            note: LOOK_AND_VOICE_SHIP_SOON,
          },
        ]}
      />,
    );

    expect(screen.getByText(LOOK_AND_VOICE_SHIP_SOON)).toBeVisible();
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
            label: TENANT_SECTION_LABEL,
            items: [
              {
                label: 'Look',
                icon: ICONS.PALETTE,
                href: `/tenants/${TENANT_ID}/look`,
                badge: { label: THIS_MILESTONE, tone: 'neutral' },
              },
            ],
          },
        ]}
      />,
    );

    const link = screen.getByRole('link', { name: /Look/ });
    expect(within(link).getByText(THIS_MILESTONE)).toBeVisible();
  });

  it('marks the item matching the current pathname active, and no other', () => {
    setPathname(`/tenants/${TENANT_ID}/look`);

    render(
      <Sidebar
        sections={[
          {
            label: TENANT_SECTION_LABEL,
            items: [
              {
                label: 'Look',
                icon: ICONS.PALETTE,
                href: `/tenants/${TENANT_ID}/look`,
              },
              {
                label: 'Voice',
                icon: ICONS.QUOTE,
                href: `/tenants/${TENANT_ID}/voice`,
              },
            ],
          },
        ]}
      />,
    );

    expect(screen.getByRole('link', { name: 'Look' })).toHaveAttribute(
      ARIA_CURRENT,
      'page',
    );
    expect(screen.getByRole('link', { name: 'Voice' })).not.toHaveAttribute(
      ARIA_CURRENT,
    );
  });

  it.each([
    {
      description:
        'marks Studio active when its own route is open, same as any other nav item',
      pathname: `/tenants/${TENANT_ID}/studio`,
      items: [
        {
          label: 'Studio',
          icon: ICONS.STUDIO,
          href: `/tenants/${TENANT_ID}/studio`,
        },
        {
          label: 'Look',
          icon: ICONS.PALETTE,
          href: `/tenants/${TENANT_ID}/look`,
        },
      ],
      activeLabel: 'Studio',
      inactiveLabel: 'Look',
    },
    {
      description:
        'switches which item is active when the route changes — the case a shared href could not express',
      pathname: `/tenants/${TENANT_ID}/voice`,
      items: [
        {
          label: 'Look',
          icon: ICONS.PALETTE,
          href: `/tenants/${TENANT_ID}/look`,
        },
        {
          label: 'Voice',
          icon: ICONS.QUOTE,
          href: `/tenants/${TENANT_ID}/voice`,
        },
      ],
      activeLabel: 'Voice',
      inactiveLabel: 'Look',
    },
  ])('$description', ({ pathname, items, activeLabel, inactiveLabel }) => {
    setPathname(pathname);

    render(<Sidebar sections={[{ label: TENANT_SECTION_LABEL, items }]} />);

    expect(screen.getByRole('link', { name: activeLabel })).toHaveAttribute(
      ARIA_CURRENT,
      'page',
    );
    expect(
      screen.getByRole('link', { name: inactiveLabel }),
    ).not.toHaveAttribute(ARIA_CURRENT);
  });

  it('renders an unbuilt destination as an inert, never-active row with its badge text', () => {
    setPathname(`/tenants/${TENANT_ID}/domain`);

    render(
      <Sidebar
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

    expect(
      screen.queryByRole('link', { name: /Domain/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Domain')).toBeVisible();
    expect(screen.getByText('later')).toBeVisible();
    expect(screen.queryByText('Domain')).not.toHaveAttribute(ARIA_CURRENT);
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
                disabledReason: PROVISIONING_ISN_T_AVAILABLE_YET,
              },
            ],
          },
        ]}
      />,
    );

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText(PROVISIONING_ISN_T_AVAILABLE_YET)).toBeVisible();
  });

  it('names its collapse toggle for its action, flipping name and aria-expanded', async () => {
    const user = userEvent.setup();
    render(<Sidebar sections={[]} />);

    const toggle = screen.getByRole('button', { name: 'Collapse sidebar' });
    expect(toggle).toHaveAttribute(ARIA_EXPANDED, 'true');

    await user.click(toggle);

    expect(
      screen.getByRole('button', { name: 'Expand sidebar' }),
    ).toHaveAttribute(ARIA_EXPANDED, 'false');
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
              label: TENANT_SECTION_LABEL,
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
