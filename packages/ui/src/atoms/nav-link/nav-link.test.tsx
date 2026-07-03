import { render, screen } from '@testing-library/react';

import { NavLink } from './nav-link';

describe(`<${NavLink.name}/>`, () => {
  it('renders children', () => {
    render(<NavLink href="/">Home</NavLink>);
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
  });

  it('has correct href when passed', () => {
    render(<NavLink href="/about">About</NavLink>);
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute(
      'href',
      '/about',
    );
  });

  it('applies active variant class when isActive={true}', () => {
    render(
      <NavLink href="/blog" isActive>
        Blog
      </NavLink>,
    );
    expect(screen.getByRole('link', { name: 'Blog' }).className).toContain(
      'font-medium',
    );
  });

  it('applies inactive variant class by default', () => {
    render(<NavLink href="/blog">Blog</NavLink>);
    expect(screen.getByRole('link', { name: 'Blog' }).className).toContain(
      'text-text-muted',
    );
  });

  it('renders with a custom component when `as` prop is provided', () => {
    const CustomLink = ({
      href,
      children,
      ...props
    }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
      <a href={href} data-custom="true" {...props}>
        {children}
      </a>
    );
    render(
      <NavLink as={CustomLink} href="/custom">
        Custom
      </NavLink>,
    );
    const link = screen.getByRole('link', { name: 'Custom' });
    expect(link).toHaveAttribute('data-custom', 'true');
    expect(link).toHaveAttribute('href', '/custom');
  });
});
