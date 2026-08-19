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

  it('renders an icon alongside the visible label', () => {
    setup({
      icon: <svg data-testid="nav-icon" />,
      children: 'RSS feed',
    });

    expect(screen.getByTestId('nav-icon')).toBeVisible();
    expect(screen.getByRole('link', { name: 'RSS feed' })).toBeVisible();
  });

  it('keeps the label as the accessible name when hasLabel is false', () => {
    setup({
      icon: <svg data-testid="nav-icon" />,
      hasLabel: false,
      children: 'RSS feed',
    });

    expect(screen.getByTestId('nav-icon')).toBeVisible();
    expect(screen.getByRole('link', { name: 'RSS feed' })).toBeVisible();
  });

  it('visually hides the label text when hasLabel is false', () => {
    setup({ hasLabel: false, children: 'RSS feed' });

    // `sr-only` is the sole observable that the label text is kept for
    // accessibility rather than shown alongside the icon.
    expect(screen.getByText('RSS feed')).toHaveClass('sr-only');
  });

  it('renders the label without a wrapper when hasLabel is not set', () => {
    setup({ children: 'RSS feed' });

    // `sr-only` is the sole observable here: jsdom doesn't apply real layout,
    // so there's no other way to assert the label renders as plain visible
    // text rather than wrapped in the visually-hidden span.
    expect(screen.getByText('RSS feed')).not.toHaveClass('sr-only');
  });

  it('sets a title attribute on an icon-only link for sighted hover users', () => {
    setup({
      icon: <svg data-testid="nav-icon" />,
      hasLabel: false,
      children: 'RSS feed',
    });

    expect(screen.getByRole('link', { name: 'RSS feed' })).toHaveAttribute(
      'title',
      'RSS feed',
    );
  });

  it('omits the title attribute when hasLabel is not set', () => {
    setup({ children: 'RSS feed' });

    expect(screen.getByRole('link', { name: 'RSS feed' })).not.toHaveAttribute(
      'title',
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
