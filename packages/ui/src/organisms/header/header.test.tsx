import { render, screen } from '@testing-library/react';

import { NavLink } from '../../atoms/nav-link';

import { Header } from './header';

describe(`<${Header.name}/>`, () => {
  it('renders Header.Brand content', () => {
    render(
      <Header>
        <Header.Brand>My Blog</Header.Brand>
      </Header>,
    );
    expect(screen.getByText('My Blog')).toBeVisible();
  });

  it('renders Header.Nav content', () => {
    render(
      <Header>
        <Header.Nav>
          <NavLink href="/">Home</NavLink>
          <NavLink href="/blog">Blog</NavLink>
        </Header.Nav>
      </Header>,
    );
    expect(screen.getByRole('link', { name: 'Home' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Blog' })).toBeVisible();
  });

  it('preserves hrefs on nav links', () => {
    render(
      <Header>
        <Header.Nav>
          <NavLink href="/blog">Blog</NavLink>
        </Header.Nav>
      </Header>,
    );
    expect(screen.getByRole('link', { name: 'Blog' })).toHaveAttribute(
      'href',
      '/blog',
    );
  });

  it('renders Header.Actions content', () => {
    render(
      <Header>
        <Header.Actions>
          <button>Menu</button>
        </Header.Actions>
      </Header>,
    );
    expect(screen.getByRole('button', { name: 'Menu' })).toBeVisible();
  });

  it('renders all three slots together in order', () => {
    render(
      <Header>
        <Header.Brand>My Blog</Header.Brand>
        <Header.Nav>
          <NavLink href="/">Home</NavLink>
        </Header.Nav>
        <Header.Actions>
          <button>Menu</button>
        </Header.Actions>
      </Header>,
    );
    expect(screen.getByText('My Blog')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Home' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Menu' })).toBeVisible();
  });

  it('renders unmatched children without dropping them', () => {
    render(
      <Header>
        <Header.Brand>My Blog</Header.Brand>
        <span>stray content</span>
      </Header>,
    );
    expect(screen.getByText('stray content')).toBeVisible();
  });

  it('renders as a <header> landmark', () => {
    render(<Header />);
    expect(screen.getByRole('banner')).toBeVisible();
  });

  it('forwards data-testid to the root element', () => {
    render(<Header dataTestId="site-header" />);
    expect(screen.getByTestId('site-header')).toBeVisible();
  });
});
