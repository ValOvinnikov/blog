import { render, screen } from '@testing-library/react';

import { PostCard } from './post-card';

describe(`<${PostCard.name}/>`, () => {
  it('renders PostCard.Title as an h3 heading', () => {
    render(
      <PostCard>
        <PostCard.Title>
          <a href="/posts/hello-world">Hello World</a>
        </PostCard.Title>
      </PostCard>,
    );
    expect(screen.getByRole('heading', { level: 3 })).toBeVisible();
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/posts/hello-world',
    );
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
        <PostCard.Title>
          <a href="/posts/hello-world">Hello World</a>
        </PostCard.Title>
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

  it('renders author name when provided via PostCard.Footer', () => {
    render(
      <PostCard>
        <PostCard.Footer authorName="Jane Doe" />
      </PostCard>,
    );
    const visibleName = screen
      .getAllByText('Jane Doe')
      .find((el) => !el.classList.contains('sr-only'));
    expect(visibleName).toBeVisible();
  });

  it('does not render author section when authorName is omitted', () => {
    render(<PostCard />);
    expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();
  });

  it('renders a time element with the correct dateTime and display text', () => {
    const iso = '2024-01-15T00:00:00Z';
    render(
      <PostCard>
        <PostCard.Footer publishedAt={iso} formattedDate="January 15, 2024" />
      </PostCard>,
    );
    const timeEl = screen.getByRole('time');
    expect(timeEl).toBeVisible();
    expect(timeEl).toHaveAttribute('dateTime', iso);
    expect(timeEl).toHaveTextContent('January 15, 2024');
  });

  it('does not render time element when publishedAt is omitted', () => {
    render(
      <PostCard>
        <PostCard.Footer formattedDate="January 15, 2024" />
      </PostCard>,
    );
    expect(screen.queryByRole('time')).not.toBeInTheDocument();
  });

  it('does not render time element when formattedDate is omitted', () => {
    render(
      <PostCard>
        <PostCard.Footer publishedAt="2024-01-15T00:00:00Z" />
      </PostCard>,
    );
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

  it('renders PostCard.Meta content', () => {
    render(
      <PostCard>
        <PostCard.Meta
          dateValue="2024-01-01"
          dateLabel="Jan 1, 2024"
          category="design"
        />
      </PostCard>,
    );
    expect(screen.getByText('Jan 1, 2024')).toBeVisible();
  });

  it('forwards data-testid to root element', () => {
    render(<PostCard dataTestId="post-card" />);
    expect(screen.getByTestId('post-card')).toBeVisible();
  });
});
