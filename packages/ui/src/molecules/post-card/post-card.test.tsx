import { renderElement, screen } from '@blog/ui/testing/custom-render';

import { PostCard } from './post-card';

describe(`<${PostCard.name}/>`, () => {
  it('renders PostCard.Title at the caller-specified heading level', () => {
    renderElement(
      <PostCard>
        <PostCard.Title level={3}>
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

  it('renders PostCard.Title at a different caller-specified heading level', () => {
    renderElement(
      <PostCard>
        <PostCard.Title level={2}>
          <a href="/posts/hello-world">Hello World</a>
        </PostCard.Title>
      </PostCard>,
    );
    expect(screen.getByRole('heading', { level: 2 })).toBeVisible();
    expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument();
  });

  it('renders PostCard.Media content', () => {
    renderElement(
      <PostCard>
        <PostCard.Media>
          <img src="/cover.jpg" alt="Cover photo" />
        </PostCard.Media>
      </PostCard>,
    );
    expect(screen.getByRole('img', { name: 'Cover photo' })).toBeVisible();
  });

  it('does not render media when PostCard.Media is omitted', () => {
    renderElement(
      <PostCard>
        <PostCard.Title level={3}>
          <a href="/posts/hello-world">Hello World</a>
        </PostCard.Title>
      </PostCard>,
    );
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders excerpt when provided', () => {
    renderElement(<PostCard excerpt="A short summary." />);
    expect(screen.getByText('A short summary.')).toBeVisible();
  });

  it('does not render excerpt element when omitted', () => {
    renderElement(<PostCard />);
    expect(screen.queryByText(/summary/i)).not.toBeInTheDocument();
  });

  it('renders all provided tags', () => {
    renderElement(<PostCard tags={['react', 'typescript']} />);
    expect(screen.getByText('react')).toBeVisible();
    expect(screen.getByText('typescript')).toBeVisible();
  });

  it('renders author name when provided via PostCard.Footer', () => {
    renderElement(
      <PostCard>
        <PostCard.Footer authorName="Jane Doe" />
      </PostCard>,
    );
    // `sr-only` is the sole observable that distinguishes the visible name
    // span from the Avatar's visually-hidden duplicate of the same text.
    const visibleName = screen
      .getAllByText('Jane Doe')
      .find((el) => !el.classList.contains('sr-only'));
    expect(visibleName).toBeVisible();
  });

  it('does not render author section when authorName is omitted', () => {
    renderElement(<PostCard />);
    expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();
  });

  it('renders a time element with the correct dateTime and display text', () => {
    const iso = '2024-01-15T00:00:00Z';
    renderElement(
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
    renderElement(
      <PostCard>
        <PostCard.Footer formattedDate="January 15, 2024" />
      </PostCard>,
    );
    expect(screen.queryByRole('time')).not.toBeInTheDocument();
  });

  it('does not render time element when formattedDate is omitted', () => {
    renderElement(
      <PostCard>
        <PostCard.Footer publishedAt="2024-01-15T00:00:00Z" />
      </PostCard>,
    );
    expect(screen.queryByRole('time')).not.toBeInTheDocument();
  });

  it('renders unmatched children without dropping them', () => {
    renderElement(
      <PostCard>
        <span>stray content</span>
      </PostCard>,
    );
    expect(screen.getByText('stray content')).toBeVisible();
  });

  it('renders PostCard.Meta content', () => {
    renderElement(
      <PostCard>
        <PostCard.Meta dateValue="2024-01-01" dateLabel="Jan 1, 2024" />
      </PostCard>,
    );
    expect(screen.getByText('Jan 1, 2024')).toBeVisible();
  });

  it('renders the topic lowercased via PostCard.Footer', () => {
    renderElement(
      <PostCard>
        <PostCard.Footer topic="Design Systems" />
      </PostCard>,
    );
    expect(screen.getByText(/design systems/)).toBeVisible();
  });

  it('renders a caller-supplied trailing icon via PostCard.Footer', () => {
    renderElement(
      <PostCard>
        <PostCard.Footer
          topic="Design Systems"
          trailingIcon={<span data-testid="custom-icon" />}
        />
      </PostCard>,
    );
    expect(screen.getByTestId('custom-icon')).toBeVisible();
  });

  it('renders leadingIcon and trailingIcon with matching spacing around the topic text', () => {
    renderElement(
      <PostCard>
        <PostCard.Footer
          topic="Design Systems"
          leadingIcon={<span aria-hidden="true">L</span>}
          trailingIcon={<span aria-hidden="true">R</span>}
        />
      </PostCard>,
    );
    const topicText = screen.getByText(/design systems/);
    expect(topicText.textContent).toBe('L design systems R');
  });

  it('forwards data-testid to root element', () => {
    renderElement(<PostCard dataTestId="post-card" />);
    expect(screen.getByTestId('post-card')).toBeVisible();
  });

  it('applies the split layout class to the root when isSplit is set', () => {
    renderElement(<PostCard isSplit={true} dataTestId="post-card" />);
    expect(screen.getByTestId('post-card')).toHaveClass('md:flex-row');
  });

  it('does not apply the split layout class when isSplit is unset', () => {
    renderElement(<PostCard dataTestId="post-card" />);
    expect(screen.getByTestId('post-card')).not.toHaveClass('md:flex-row');
  });

  it('clamps the excerpt to three lines when isLead is set', () => {
    renderElement(<PostCard isLead={true} excerpt="A short summary." />);
    expect(screen.getByText('A short summary.')).toHaveClass('line-clamp-3');
  });

  it('clamps the excerpt to two lines when isLead is unset', () => {
    renderElement(<PostCard excerpt="A short summary." />);
    expect(screen.getByText('A short summary.')).toHaveClass('line-clamp-2');
  });

  it('renders the title at display size when isLead is set', () => {
    renderElement(
      <PostCard isLead={true}>
        <PostCard.Title level={3}>
          <a href="/posts/hello-world">Hello World</a>
        </PostCard.Title>
      </PostCard>,
    );
    expect(screen.getByRole('heading', { level: 3 })).toHaveClass(
      'text-post-title',
    );
  });

  it('renders the title at card size when isLead is unset', () => {
    renderElement(
      <PostCard>
        <PostCard.Title level={3}>
          <a href="/posts/hello-world">Hello World</a>
        </PostCard.Title>
      </PostCard>,
    );
    expect(screen.getByRole('heading', { level: 3 })).toHaveClass(
      'text-card-title',
    );
  });

  it('renders a taller media frame when isLead is set', () => {
    renderElement(
      <PostCard isLead={true}>
        <PostCard.Media dataTestId="post-card-media">
          <img src="/cover.jpg" alt="Cover photo" />
        </PostCard.Media>
      </PostCard>,
    );
    expect(screen.getByTestId('post-card-media')).toHaveClass('aspect-[4/3]');
  });

  it('renders the default media frame when isLead is unset', () => {
    renderElement(
      <PostCard>
        <PostCard.Media dataTestId="post-card-media">
          <img src="/cover.jpg" alt="Cover photo" />
        </PostCard.Media>
      </PostCard>,
    );
    expect(screen.getByTestId('post-card-media')).toHaveClass('aspect-video');
  });
});
