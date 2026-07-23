import { renderElement, screen } from '@web/testing/custom-render';
import type { ReactNode } from 'react';

import { SiteNavigation } from './site-navigation';

const { usePathnameMock } = vi.hoisted(() => ({
  usePathnameMock: vi.fn(),
}));

vi.mock('@web/i18n/navigation', () => ({
  usePathname: usePathnameMock,
}));

// `PrimaryNavigation`/`NavLink` render `isActive` as styling only (no
// `aria-current` yet — see the reported a11y gap); this test cares about
// what `SiteNavigation` computes, so it swaps in a fake that surfaces
// `isActive` as an assertable `aria-current` rather than asserting classes.
vi.mock('@blog/ui/molecules', () => ({
  PrimaryNavigation: ({
    links,
    actions,
  }: {
    links: Array<{ href: string; label: string; isActive?: boolean }>;
    actions?: ReactNode;
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
    </nav>
  ),
}));

const links = [
  { label: 'Home', href: '/', target: undefined, platform: undefined },
  { label: 'Blog', href: '/blog', target: undefined, platform: undefined },
  {
    label: 'About',
    href: '/about',
    target: undefined,
    platform: undefined,
  },
];

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
});
