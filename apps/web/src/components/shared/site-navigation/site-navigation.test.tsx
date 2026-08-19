import userEvent from '@testing-library/user-event';
import { fireEvent, renderElement, screen } from '@web/testing/custom-render';
import type { ReactNode } from 'react';

import { SiteNavigation } from './site-navigation';

const { usePathnameMock } = vi.hoisted(() => ({
  usePathnameMock: vi.fn(),
}));

vi.mock('@web/i18n/navigation', () => ({
  usePathname: usePathnameMock,
}));

type TFakeMobileToggle = {
  isOpen: boolean;
  onToggle: () => void;
  ariaLabel: string;
  panelId: string;
};

// `PrimaryNavigation`/`NavLink` render `isActive` as styling only (no
// `aria-current` yet — see the reported a11y gap); this test cares about
// what `SiteNavigation` computes, so it swaps in a fake that surfaces
// `isActive` as an assertable `aria-current` rather than asserting classes.
// The fake also mirrors the real `mobileToggle` markup (a toggle button
// linked to a panel via `aria-controls`/`id`) closely enough to exercise
// `SiteNavigation`'s own open/close wiring end-to-end.
vi.mock('@blog/ui/molecules', () => ({
  PrimaryNavigation: ({
    links,
    actions,
    mobileToggle,
  }: {
    links: Array<{ href: string; label: string; isActive?: boolean }>;
    actions?: ReactNode;
    mobileToggle?: TFakeMobileToggle;
  }) => (
    <nav>
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          aria-current={link.isActive ? 'page' : undefined}
        >
          {link.label}
        </a>
      ))}
      {actions}
      {mobileToggle && (
        <>
          <button
            type="button"
            aria-expanded={mobileToggle.isOpen}
            aria-controls={mobileToggle.panelId}
            onClick={mobileToggle.onToggle}
          >
            {mobileToggle.ariaLabel}
          </button>
          <div id={mobileToggle.panelId} hidden={!mobileToggle.isOpen}>
            {links.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </div>
        </>
      )}
    </nav>
  ),
}));

const links = [
  {
    label: 'Home',
    href: '/',
    target: undefined,
    platform: undefined,
    ariaLabel: undefined,
  },
  {
    label: 'Blog',
    href: '/blog',
    target: undefined,
    platform: undefined,
    ariaLabel: undefined,
  },
  {
    label: 'About',
    href: '/about',
    target: undefined,
    platform: undefined,
    ariaLabel: undefined,
  },
];

const getToggle = () =>
  screen.getByRole('button', { name: 'Toggle navigation menu' });

describe(`<${SiteNavigation.name}/>`, () => {
  it('marks the Home item active only on the exact root path', () => {
    usePathnameMock.mockReturnValue('/');
    renderElement(<SiteNavigation links={links} />);

    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Blog' })).not.toHaveAttribute(
      'aria-current',
    );
    expect(screen.getByRole('link', { name: 'About' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('does not mark Home active on a nested route', () => {
    usePathnameMock.mockReturnValue('/blog');
    renderElement(<SiteNavigation links={links} />);

    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('marks a section item active via prefix match on nested routes', () => {
    usePathnameMock.mockReturnValue('/blog/hello-world');
    renderElement(<SiteNavigation links={links} />);

    expect(screen.getByRole('link', { name: 'Blog' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'About' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('does not match a section item against an unrelated path that merely shares a prefix', () => {
    usePathnameMock.mockReturnValue('/blogging');
    renderElement(<SiteNavigation links={links} />);

    expect(screen.getByRole('link', { name: 'Blog' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('renders the actions slot', () => {
    usePathnameMock.mockReturnValue('/');
    renderElement(
      <SiteNavigation links={links} actions={<button>Toggle</button>} />,
    );

    expect(screen.getByRole('button', { name: 'Toggle' })).toBeInTheDocument();
  });

  describe('mobile toggle', () => {
    beforeEach(() => {
      usePathnameMock.mockReturnValue('/');
    });

    it('passes a real, non-generic accessible name for the toggle', () => {
      renderElement(<SiteNavigation links={links} />);

      expect(getToggle()).toHaveAccessibleName('Toggle navigation menu');
    });

    it('opens the panel on toggle click and reflects it via aria-expanded', async () => {
      const user = userEvent.setup();
      renderElement(<SiteNavigation links={links} />);
      const toggle = getToggle();

      expect(toggle).toHaveAttribute('aria-expanded', 'false');

      await user.click(toggle);

      expect(toggle).toHaveAttribute('aria-expanded', 'true');
    });

    it('closes on Escape and returns focus to the toggle', async () => {
      const user = userEvent.setup();
      renderElement(<SiteNavigation links={links} />);
      const toggle = getToggle();
      await user.click(toggle);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(toggle).toHaveAttribute('aria-expanded', 'false');
      expect(document.activeElement).toBe(toggle);
    });

    it('closes on an outside click', async () => {
      const user = userEvent.setup();
      renderElement(<SiteNavigation links={links} />);
      const toggle = getToggle();
      await user.click(toggle);

      fireEvent.mouseDown(document.body);

      expect(toggle).toHaveAttribute('aria-expanded', 'false');
    });

    it('closes automatically when the route changes', async () => {
      const user = userEvent.setup();
      const { rerender } = renderElement(<SiteNavigation links={links} />);
      const toggle = getToggle();
      await user.click(toggle);
      expect(toggle).toHaveAttribute('aria-expanded', 'true');

      usePathnameMock.mockReturnValue('/blog');
      rerender(<SiteNavigation links={links} />);

      expect(getToggle()).toHaveAttribute('aria-expanded', 'false');
    });
  });
});
