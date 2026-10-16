import { TextLink } from '@blog/ui/components/atoms/text-link';
import { renderElement, screen } from '@blog/ui/testing/custom-render';

import { Header } from './header';

describe(`<${Header.name}/>`, () => {
  it('renders Header.Brand content', () => {
    renderElement(
      <Header>
        <Header.Brand>My Blog</Header.Brand>
      </Header>,
    );
    expect(screen.getByText('My Blog')).toBeVisible();
  });

  it('renders Header.Nav content', () => {
    renderElement(
      <Header>
        <Header.Nav>
          <TextLink appearance="nav" href="/">
            Home
          </TextLink>
          <TextLink appearance="nav" href="/blog">
            Blog
          </TextLink>
        </Header.Nav>
      </Header>,
    );
    expect(screen.getByRole('link', { name: 'Home' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Blog' })).toBeVisible();
  });

  it('preserves hrefs on nav links', () => {
    renderElement(
      <Header>
        <Header.Nav>
          <TextLink appearance="nav" href="/blog">
            Blog
          </TextLink>
        </Header.Nav>
      </Header>,
    );
    expect(screen.getByRole('link', { name: 'Blog' })).toHaveAttribute(
      'href',
      '/blog',
    );
  });

  it('renders Header.Actions content', () => {
    renderElement(
      <Header>
        <Header.Actions>
          <button>Menu</button>
        </Header.Actions>
      </Header>,
    );
    expect(screen.getByRole('button', { name: 'Menu' })).toBeVisible();
  });

  it('renders all three slots together in order', () => {
    renderElement(
      <Header>
        <Header.Brand>My Blog</Header.Brand>
        <Header.Nav>
          <TextLink appearance="nav" href="/">
            Home
          </TextLink>
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
    renderElement(
      <Header>
        <Header.Brand>My Blog</Header.Brand>
        <span>stray content</span>
      </Header>,
    );
    expect(screen.getByText('stray content')).toBeVisible();
  });

  it('renders as a <header> landmark', () => {
    renderElement(<Header />);
    expect(screen.getByRole('banner')).toBeVisible();
  });

  it('forwards data-testid to the root element', () => {
    renderElement(<Header dataTestId="site-header" />);
    expect(screen.getByTestId('site-header')).toBeVisible();
  });
});
