import { render, screen } from '@testing-library/react';

import { PostCard } from './post-card';

describe(`<${PostCard.name}/>`, () => {
  it('renders PostCard.Title content as a heading', () => {
    render(
      <PostCard>
        <PostCard.Title href="/posts/hello-world">Hello World</PostCard.Title>
      </PostCard>,
    );
    expect(screen.getByRole('heading', { name: 'Hello World' })).toBeVisible();
  });

  it('wraps PostCard.Title in a link with the correct href by default', () => {
    render(
      <PostCard>
        <PostCard.Title href="/posts/hello-world">Hello World</PostCard.Title>
      </PostCard>,
    );
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/posts/hello-world',
    );
  });

  it('renders PostCard.Title as a custom element when `as` is provided', () => {
    const CustomLink = ({
      href,
      children,
      ...rest
    }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
      <a href={href} data-custom="true" {...rest}>
        {children}
      </a>
    );
    render(
      <PostCard>
        <PostCard.Title as={CustomLink} href="/posts/custom">
          Custom
        </PostCard.Title>
      </PostCard>,
    );
    expect(screen.getByRole('link')).toHaveAttribute('data-custom', 'true');
  });

  it('renders PostCard.Media content', () => {
    render(
      <PostCard>
        <PostCard.Media>
          <img src="/cover.jpg" alt="Cover photo" />
        </PostCard.Media>
      </PostCard>,
    );
    expect(screen.getByRole('img', { name: 'Cover photo' })).toBeVisible();
  });

  it('does not render media when PostCard.Media is omitted', () => {
    render(
      <PostCard>
        <PostCard.Title href="/posts/hello-world">Hello World</PostCard.Title>
      </PostCard>,
    );
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders excerpt when provided', () => {
    render(<PostCard excerpt="A short summary." />);
    expect(screen.getByText('A short summary.')).toBeVisible();
  });

  it('does not render excerpt element when omitted', () => {
    render(<PostCard />);
    expect(screen.queryByText(/summary/i)).not.toBeInTheDocument();
  });

  it('renders all provided tags', () => {
    render(<PostCard tags={['react', 'typescript']} />);
    expect(screen.getByText('react')).toBeVisible();
    expect(screen.getByText('typescript')).toBeVisible();
  });

  it('does not render tags area when tags is empty', () => {
    const { container } = render(<PostCard tags={[]} />);
    expect(container.querySelectorAll('span[class]').length).toBe(0);
  });

  it('renders author name when provided', () => {
    render(<PostCard authorName="Jane Doe" />);
    const visibleName = screen
      .getAllByText('Jane Doe')
      .find((el) => !el.classList.contains('sr-only'));
    expect(visibleName).toBeVisible();
  });

  it('does not render author section when authorName is omitted', () => {
    render(<PostCard />);
    expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();
  });

  it('renders a time element with the correct dateTime attribute', () => {
    const iso = '2024-01-15T00:00:00Z';
    render(<PostCard publishedAt={iso} />);
    const timeEl = screen.getByRole('time');
    expect(timeEl).toBeVisible();
    expect(timeEl).toHaveAttribute('dateTime', iso);
  });

  it('does not render time element when publishedAt is omitted', () => {
    render(<PostCard />);
    expect(screen.queryByRole('time')).not.toBeInTheDocument();
  });

  it('renders unmatched children without dropping them', () => {
    render(
      <PostCard>
        <span>stray content</span>
      </PostCard>,
    );
    expect(screen.getByText('stray content')).toBeVisible();
  });

  it('forwards className to root element', () => {
    const { container } = render(<PostCard className="extra-class" />);
    expect(container.firstChild).toHaveClass('extra-class');
  });

  it('forwards data-testid to root element', () => {
    render(<PostCard dataTestId="post-card" />);
    expect(screen.getByTestId('post-card')).toBeVisible();
  });
});
