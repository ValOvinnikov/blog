import { render, screen } from '@testing-library/react';

import { NavLink } from '../../atoms/nav-link';

import { Footer } from './footer';

describe(`<${Footer.name}/>`, () => {
  it('renders Footer.Copyright with the current year and title', () => {
    render(
      <Footer>
        <Footer.Copyright title="My Blog" />
      </Footer>,
    );
    const year = new Date().getFullYear();
    expect(screen.getByText(`© ${year} My Blog`)).toBeVisible();
  });

  it('renders Footer.Nav content', () => {
    render(
      <Footer>
        <Footer.Nav>
          <NavLink href="/about">About</NavLink>
          <NavLink href="/contact">Contact</NavLink>
        </Footer.Nav>
      </Footer>,
    );
    expect(screen.getByRole('link', { name: 'About' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Contact' })).toBeVisible();
  });

  it('preserves hrefs on nav links', () => {
    render(
      <Footer>
        <Footer.Nav>
          <NavLink href="/about">About</NavLink>
        </Footer.Nav>
      </Footer>,
    );
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute(
      'href',
      '/about',
    );
  });

  it('does not render a nav element when Footer.Nav is omitted', () => {
    render(
      <Footer>
        <Footer.Copyright title="My Blog" />
      </Footer>,
    );
    expect(
      screen.queryByRole('navigation', { name: 'Footer navigation' }),
    ).not.toBeInTheDocument();
  });

  it('renders unmatched children without dropping them', () => {
    render(
      <Footer>
        <Footer.Copyright title="My Blog" />
        <span>stray content</span>
      </Footer>,
    );
    expect(screen.getByText('stray content')).toBeVisible();
  });

  it('renders as a <footer> landmark', () => {
    render(<Footer />);
    expect(screen.getByRole('contentinfo')).toBeVisible();
  });

  it('forwards data-testid to the root element', () => {
    render(<Footer dataTestId="site-footer" />);
    expect(screen.getByTestId('site-footer')).toBeVisible();
  });
});
