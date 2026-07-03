import { render, screen } from '@testing-library/react';

import { Footer } from './footer';

const defaultNavLinks = [
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

describe(`<${Footer.name}/>`, () => {
  it('renders the title in the copyright line', () => {
    render(<Footer title="My Blog" />);
    expect(screen.getByText(/My Blog/)).toBeVisible();
  });

  it('renders nav links when provided', () => {
    render(<Footer title="My Blog" navLinks={defaultNavLinks} />);
    expect(screen.getByRole('link', { name: 'About' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Contact' })).toBeVisible();
  });

  it('renders correct hrefs on nav links', () => {
    render(<Footer title="My Blog" navLinks={defaultNavLinks} />);
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute(
      'href',
      '/about',
    );
    expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute(
      'href',
      '/contact',
    );
  });

  it('does not render a nav element when navLinks is omitted', () => {
    render(<Footer title="My Blog" />);
    expect(
      screen.queryByRole('navigation', { name: 'Footer navigation' }),
    ).not.toBeInTheDocument();
  });

  it('does not render a nav element when navLinks is an empty array', () => {
    render(<Footer title="My Blog" navLinks={[]} />);
    expect(
      screen.queryByRole('navigation', { name: 'Footer navigation' }),
    ).not.toBeInTheDocument();
  });

  it('forwards className to the root element', () => {
    render(<Footer title="My Blog" className="custom-class" />);
    const footer = screen.getByRole('contentinfo');
    expect(footer.className).toContain('custom-class');
  });

  it('forwards data-testid to the root element', () => {
    render(<Footer title="My Blog" dataTestId="site-footer" />);
    expect(screen.getByTestId('site-footer')).toBeVisible();
  });
});
