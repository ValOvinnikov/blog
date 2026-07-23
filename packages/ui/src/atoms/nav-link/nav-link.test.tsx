import {
  customRender,
  renderElement,
  screen,
} from '@blog/ui/testing/custom-render';
import type { AnchorHTMLAttributes } from 'react';

import { NavLink } from './nav-link';

const setup = customRender(NavLink, {
  href: '/',
  children: 'Home',
});

describe(`<${NavLink.name}/>`, () => {
  it('renders children', () => {
    setup();
    expect(screen.getByRole('link', { name: 'Home' })).toBeVisible();
  });

  it('has correct href when passed', () => {
    setup({ href: '/about', children: 'About' });
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute(
      'href',
      '/about',
    );
  });

  it('active variant applies accent color', () => {
    setup({ href: '/blog', isActive: true, children: 'Blog' });
    expect(screen.getByRole('link', { name: 'Blog' }).className).toContain(
      'text-accent',
    );
  });

  it('inactive variant applies subtle color by default', () => {
    setup({ href: '/blog', children: 'Blog' });
    expect(screen.getByRole('link', { name: 'Blog' }).className).toContain(
      'text-subtle',
    );
  });

  it('sets aria-current="page" when active', () => {
    setup({ href: '/blog', isActive: true, children: 'Blog' });
    expect(screen.getByRole('link', { name: 'Blog' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('omits aria-current when inactive', () => {
    setup({ href: '/blog', children: 'Blog' });
    expect(screen.getByRole('link', { name: 'Blog' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('renders with a custom component when `as` prop is provided', () => {
    const CustomLink = ({
      href,
      children,
      ...props
    }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
      <a href={href} data-custom="true" {...props}>
        {children}
      </a>
    );
    renderElement(
      <NavLink as={CustomLink} href="/custom">
        Custom
      </NavLink>,
    );
    const link = screen.getByRole('link', { name: 'Custom' });
    expect(link).toHaveAttribute('data-custom', 'true');
    expect(link).toHaveAttribute('href', '/custom');
  });
});
