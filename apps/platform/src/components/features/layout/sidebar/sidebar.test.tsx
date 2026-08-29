import { ICONS } from '@blog/config';
import { SidebarCollapseProvider } from '@platform/components/features/layout/sidebar-collapse-provider';
import {
  renderWithIntl,
  screen,
  within,
} from '@platform/testing/custom-render';
import userEvent from '@testing-library/user-event';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { Sidebar } from './sidebar';

const { usePathnameMock } = vi.hoisted(() => ({
  usePathnameMock: vi.fn(),
}));

// `SidebarNavLink` resolves the active route via `@platform/i18n/navigation`
// (next-intl's locale-aware `usePathname`), not plain `next/navigation` —
// mocking the wrong module here previously let a broken import ship
// unnoticed (see `sidebar-nav-link.tsx`).
vi.mock('@platform/i18n/navigation', () => ({
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

// `Sidebar` renders `SidebarCollapseToggle`, which reads `useSidebarCollapse`
// — every render needs the ambient `SidebarCollapseProvider` `ShellFrame`
// supplies in production.
const render = (ui: ReactNode) =>
  renderWithIntl(
    <SidebarCollapseProvider isInitiallyCollapsed={false}>
      {ui}
    </SidebarCollapseProvider>,
  );

const setPathname = (pathname: string) => {
  usePathnameMock.mockReturnValue(pathname);
};

describe(Sidebar, () => {
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

  it('marks Studio active when its own route is open, same as any other nav item', () => {
    setPathname('/tenants/tenant-1/studio');

    render(
      <Sidebar
        sections={[
          {
            label: 'Tenant · acme',
            items: [
              {
                label: 'Studio',
                icon: ICONS.STUDIO,
                href: '/tenants/tenant-1/studio',
              },
              {
                label: 'Look',
                icon: ICONS.PALETTE,
                href: '/tenants/tenant-1/look',
              },
            ],
          },
        ]}
      />,
    );

    expect(screen.getByRole('link', { name: 'Studio' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Look' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('switches which item is active when the route changes — the case a shared href could not express', () => {
    setPathname('/tenants/tenant-1/voice');

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

    expect(screen.getByRole('link', { name: 'Voice' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Look' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('renders an unbuilt destination as an inert, non-navigable row carrying its badge as real text, and never as active even at its own path', () => {
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

  it('names its collapse toggle for the action it performs, and flips both the name and aria-expanded on click', async () => {
    const user = userEvent.setup();
    render(<Sidebar sections={[]} />);

    const toggle = screen.getByRole('button', { name: 'Collapse sidebar' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await user.click(toggle);

    expect(
      screen.getByRole('button', { name: 'Expand sidebar' }),
    ).toHaveAttribute('aria-expanded', 'false');
  });

  it('keeps a nav link reachable by its accessible name once the sidebar starts collapsed', () => {
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

    expect(screen.getByRole('link', { name: 'Tenants' })).toHaveAttribute(
      'href',
      '/tenants',
    );
  });
});
