import { renderElement, screen } from '@blog/ui/testing/custom-render';

import { NavLink } from '../../atoms/nav-link';

import { Footer } from './footer';

describe(`<${Footer.name}/>`, () => {
  it('renders Footer.Copyright with the current year and title', () => {
    renderElement(
      <Footer>
        <Footer.Copyright title="My Blog" />
      </Footer>,
    );
    const year = new Date().getFullYear();
    expect(screen.getByText(`© ${year} My Blog`)).toBeVisible();
  });

  it('renders Footer.Nav content', () => {
    renderElement(
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
    renderElement(
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
    renderElement(
      <Footer>
        <Footer.Copyright title="My Blog" />
      </Footer>,
    );
    expect(
      screen.queryByRole('navigation', { name: 'Footer navigation' }),
    ).not.toBeInTheDocument();
  });

  it('renders unmatched children without dropping them', () => {
    renderElement(
      <Footer>
        <Footer.Copyright title="My Blog" />
        <span>stray content</span>
      </Footer>,
    );
    expect(screen.getByText('stray content')).toBeVisible();
  });

  it('renders as a <footer> landmark', () => {
    renderElement(<Footer />);
    expect(screen.getByRole('contentinfo')).toBeVisible();
  });

  it('forwards data-testid to the root element', () => {
    renderElement(<Footer dataTestId="site-footer" />);
    expect(screen.getByTestId('site-footer')).toBeVisible();
  });
});
