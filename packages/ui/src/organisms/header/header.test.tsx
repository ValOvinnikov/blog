import { render, screen } from '@testing-library/react';

import type { INavLinkItem } from './header';
import { Header } from './header';

const defaultNavLinks: INavLinkItem[] = [
  { href: '/', label: 'Home' },
  { href: '/blog', label: 'Blog' },
  { href: '/about', label: 'About' },
];

describe(`<${Header.name}/>`, () => {
  it('renders the title', () => {
    render(<Header title="My Blog" navLinks={[]} />);
    expect(screen.getByText('My Blog')).toBeVisible();
  });

  it('renders all nav links', () => {
    render(<Header title="My Blog" navLinks={defaultNavLinks} />);
    expect(screen.getByRole('link', { name: 'Home' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Blog' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'About' })).toBeVisible();
  });

  it('renders the correct href on each nav link', () => {
    render(<Header title="My Blog" navLinks={defaultNavLinks} />);
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute(
      'href',
      '/',
    );
    expect(screen.getByRole('link', { name: 'Blog' })).toHaveAttribute(
      'href',
      '/blog',
    );
  });

  it('applies the active variant class to an active link', () => {
    const linksWithActive: INavLinkItem[] = [
      { href: '/', label: 'Home' },
      { href: '/blog', label: 'Blog', isActive: true },
    ];
    render(<Header title="My Blog" navLinks={linksWithActive} />);
    const activeLink = screen.getByRole('link', { name: 'Blog' });
    expect(activeLink.className).toContain('font-medium');
  });

  it('does not apply the active variant class to an inactive link', () => {
    render(<Header title="My Blog" navLinks={defaultNavLinks} />);
    const inactiveLink = screen.getByRole('link', { name: 'Home' });
    expect(inactiveLink.className).not.toContain('font-medium');
  });

  it('renders the ThemeToggle button', () => {
    render(<Header title="My Blog" navLinks={defaultNavLinks} />);
    expect(screen.getByRole('button')).toBeVisible();
  });

  it('forwards className to the root element', () => {
    render(<Header title="My Blog" navLinks={[]} className="custom-class" />);
    const header = screen.getByRole('banner');
    expect(header.className).toContain('custom-class');
  });

  it('forwards data-testid to the root element', () => {
    render(<Header title="My Blog" navLinks={[]} dataTestId="site-header" />);
    expect(screen.getByTestId('site-header')).toBeVisible();
  });
});
