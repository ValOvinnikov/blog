import { renderElement, screen } from '@blog/ui/testing/custom-render';

import { MediaCard } from './media-card';

describe(`<${MediaCard.name}/>`, () => {
  it('renders MediaCard.Title at the caller-specified heading level', () => {
    renderElement(
      <MediaCard>
        <MediaCard.Title level={3}>
          <a href="/posts/hello-world">Hello World</a>
        </MediaCard.Title>
      </MediaCard>,
    );
    expect(screen.getByRole('heading', { level: 3 })).toBeVisible();
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/posts/hello-world',
    );
  });

  it('renders MediaCard.Title at a different caller-specified heading level', () => {
    renderElement(
      <MediaCard>
        <MediaCard.Title level={2}>
          <a href="/posts/hello-world">Hello World</a>
        </MediaCard.Title>
      </MediaCard>,
    );
    expect(screen.getByRole('heading', { level: 2 })).toBeVisible();
    expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument();
  });

  it('renders MediaCard.Media content', () => {
    renderElement(
      <MediaCard>
        <MediaCard.Media>
          <img src="/cover.jpg" alt="Cover photo" />
        </MediaCard.Media>
      </MediaCard>,
    );
    expect(screen.getByRole('img', { name: 'Cover photo' })).toBeVisible();
  });

  it('does not render media when MediaCard.Media is omitted', () => {
    renderElement(
      <MediaCard>
        <MediaCard.Title level={3}>
          <a href="/posts/hello-world">Hello World</a>
        </MediaCard.Title>
      </MediaCard>,
    );
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders excerpt when provided', () => {
    renderElement(<MediaCard excerpt="A short summary." />);
    expect(screen.getByText('A short summary.')).toBeVisible();
  });

  it('does not render excerpt element when omitted', () => {
    renderElement(<MediaCard />);
    expect(screen.queryByText(/summary/i)).not.toBeInTheDocument();
  });

  it('renders all provided tags', () => {
    renderElement(<MediaCard tags={['react', 'typescript']} />);
    expect(screen.getByText('react')).toBeVisible();
    expect(screen.getByText('typescript')).toBeVisible();
  });

  it('renders author name when provided via MediaCard.Footer', () => {
    renderElement(
      <MediaCard>
        <MediaCard.Footer authorName="Jane Doe" />
      </MediaCard>,
    );
    // `sr-only` is the sole observable that distinguishes the visible name
    // span from the Avatar's visually-hidden duplicate of the same text.
    const visibleName = screen
      .getAllByText('Jane Doe')
      .find((el) => !el.classList.contains('sr-only'));
    expect(visibleName).toBeVisible();
  });

  it('does not render author section when authorName is omitted', () => {
    renderElement(<MediaCard />);
    expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();
  });

  it('renders a time element with the correct dateTime and display text', () => {
    const iso = '2024-01-15T00:00:00Z';
    renderElement(
      <MediaCard>
        <MediaCard.Footer publishedAt={iso} formattedDate="January 15, 2024" />
      </MediaCard>,
    );
    const timeEl = screen.getByRole('time');
    expect(timeEl).toBeVisible();
    expect(timeEl).toHaveAttribute('dateTime', iso);
    expect(timeEl).toHaveTextContent('January 15, 2024');
  });

  it('does not render time element when publishedAt is omitted', () => {
    renderElement(
      <MediaCard>
        <MediaCard.Footer formattedDate="January 15, 2024" />
      </MediaCard>,
    );
    expect(screen.queryByRole('time')).not.toBeInTheDocument();
  });

  it('does not render time element when formattedDate is omitted', () => {
    renderElement(
      <MediaCard>
        <MediaCard.Footer publishedAt="2024-01-15T00:00:00Z" />
      </MediaCard>,
    );
    expect(screen.queryByRole('time')).not.toBeInTheDocument();
  });

  it('renders unmatched children without dropping them', () => {
    renderElement(
      <MediaCard>
        <span>stray content</span>
      </MediaCard>,
    );
    expect(screen.getByText('stray content')).toBeVisible();
  });

  it('renders MediaCard.Meta content', () => {
    renderElement(
      <MediaCard>
        <MediaCard.Meta dateValue="2024-01-01" dateLabel="Jan 1, 2024" />
      </MediaCard>,
    );
    expect(screen.getByText('Jan 1, 2024')).toBeVisible();
  });

  it('renders the topic lowercased via MediaCard.Footer', () => {
    renderElement(
      <MediaCard>
        <MediaCard.Footer topic="Design Systems" />
      </MediaCard>,
    );
    expect(screen.getByText(/design systems/)).toBeVisible();
  });

  it('renders a caller-supplied trailing icon via MediaCard.Footer', () => {
    renderElement(
      <MediaCard>
        <MediaCard.Footer
          topic="Design Systems"
          trailingIcon={<span data-testid="custom-icon" />}
        />
      </MediaCard>,
    );
    expect(screen.getByTestId('custom-icon')).toBeVisible();
  });

  it('renders leadingIcon and trailingIcon with matching spacing around the topic text', () => {
    renderElement(
      <MediaCard>
        <MediaCard.Footer
          topic="Design Systems"
          leadingIcon={<span aria-hidden="true">L</span>}
          trailingIcon={<span aria-hidden="true">R</span>}
        />
      </MediaCard>,
    );
    const topicText = screen.getByText(/design systems/);
    expect(topicText.textContent).toBe('L design systems R');
  });

  it('forwards data-testid to root element', () => {
    renderElement(<MediaCard dataTestId="media-card" />);
    expect(screen.getByTestId('media-card')).toBeVisible();
  });

  it('applies the split layout class to the root when isSplit is set and Media is present', () => {
    renderElement(
      <MediaCard isSplit={true} dataTestId="media-card">
        <MediaCard.Media>
          <img src="/cover.jpg" alt="Cover photo" />
        </MediaCard.Media>
      </MediaCard>,
    );
    expect(screen.getByTestId('media-card')).toHaveClass('md:flex-row');
    expect(screen.getByTestId('media-card-content')).toHaveClass('md:w-1/2');
  });

  it('does not apply the split layout class when isSplit is unset', () => {
    renderElement(<MediaCard dataTestId="media-card" />);
    expect(screen.getByTestId('media-card')).not.toHaveClass('md:flex-row');
  });

  it('does not apply the split layout when isSplit is set but no Media slot is present', () => {
    renderElement(
      <MediaCard isSplit={true} dataTestId="media-card">
        <MediaCard.Title level={3}>
          <a href="/posts/hello-world">Hello World</a>
        </MediaCard.Title>
      </MediaCard>,
    );
    expect(screen.getByTestId('media-card')).not.toHaveClass('md:flex-row');
    expect(screen.getByTestId('media-card-content')).not.toHaveClass(
      'md:w-1/2',
    );
  });

  it('wraps MediaCard.Media in a split container only when isSplit is set and Media is present', () => {
    renderElement(
      <MediaCard isSplit={true}>
        <MediaCard.Media dataTestId="media-card-media">
          <img src="/cover.jpg" alt="Cover photo" />
        </MediaCard.Media>
      </MediaCard>,
    );
    const media = screen.getByTestId('media-card-media');
    const article = screen.getByRole('article');
    expect(media.parentElement).not.toBe(article);
    expect(media.parentElement?.parentElement).toBe(article);
  });

  it('renders MediaCard.Media as a direct child of the article when isSplit is unset', () => {
    renderElement(
      <MediaCard>
        <MediaCard.Media dataTestId="media-card-media">
          <img src="/cover.jpg" alt="Cover photo" />
        </MediaCard.Media>
      </MediaCard>,
    );
    const media = screen.getByTestId('media-card-media');
    const article = screen.getByRole('article');
    expect(media.parentElement).toBe(article);
  });

  it('clamps the excerpt to three lines when isLead is set', () => {
    renderElement(<MediaCard isLead={true} excerpt="A short summary." />);
    expect(screen.getByText('A short summary.')).toHaveClass('line-clamp-3');
  });

  it('clamps the excerpt to two lines when isLead is unset', () => {
    renderElement(<MediaCard excerpt="A short summary." />);
    expect(screen.getByText('A short summary.')).toHaveClass('line-clamp-2');
  });

  it('renders the title at display size when isLead is set', () => {
    renderElement(
      <MediaCard isLead={true}>
        <MediaCard.Title level={3}>
          <a href="/posts/hello-world">Hello World</a>
        </MediaCard.Title>
      </MediaCard>,
    );
    expect(screen.getByRole('heading', { level: 3 })).toHaveClass(
      'text-post-title',
    );
  });

  it('renders the title at card size when isLead is unset', () => {
    renderElement(
      <MediaCard>
        <MediaCard.Title level={3}>
          <a href="/posts/hello-world">Hello World</a>
        </MediaCard.Title>
      </MediaCard>,
    );
    expect(screen.getByRole('heading', { level: 3 })).toHaveClass(
      'text-card-title',
    );
  });

  it('renders a taller media frame when isLead is set', () => {
    renderElement(
      <MediaCard isLead={true}>
        <MediaCard.Media dataTestId="media-card-media">
          <img src="/cover.jpg" alt="Cover photo" />
        </MediaCard.Media>
      </MediaCard>,
    );
    expect(screen.getByTestId('media-card-media')).toHaveClass('aspect-[4/3]');
  });

  it('renders the default media frame when isLead is unset', () => {
    renderElement(
      <MediaCard>
        <MediaCard.Media dataTestId="media-card-media">
          <img src="/cover.jpg" alt="Cover photo" />
        </MediaCard.Media>
      </MediaCard>,
    );
    expect(screen.getByTestId('media-card-media')).toHaveClass('aspect-video');
  });

  it('renders the wide shape identically to the pre-existing default, with and without isLead', () => {
    const { unmount } = renderElement(
      <MediaCard>
        <MediaCard.Media shape="wide" dataTestId="media-card-media">
          <img src="/cover.jpg" alt="Cover photo" />
        </MediaCard.Media>
      </MediaCard>,
    );
    expect(screen.getByTestId('media-card-media')).toHaveClass(
      'w-full',
      'aspect-video',
    );
    unmount();

    renderElement(
      <MediaCard isLead={true}>
        <MediaCard.Media shape="wide" dataTestId="media-card-media">
          <img src="/cover.jpg" alt="Cover photo" />
        </MediaCard.Media>
      </MediaCard>,
    );
    expect(screen.getByTestId('media-card-media')).toHaveClass(
      'w-full',
      'aspect-[4/3]',
    );
  });

  it('renders the square shape edge to edge and 1:1, unaffected by isLead', () => {
    const { unmount } = renderElement(
      <MediaCard>
        <MediaCard.Media shape="square" dataTestId="media-card-media">
          <img src="/cover.jpg" alt="Cover photo" />
        </MediaCard.Media>
      </MediaCard>,
    );
    expect(screen.getByTestId('media-card-media')).toHaveClass(
      'w-full',
      'aspect-square',
    );
    unmount();

    renderElement(
      <MediaCard isLead={true}>
        <MediaCard.Media shape="square" dataTestId="media-card-media">
          <img src="/cover.jpg" alt="Cover photo" />
        </MediaCard.Media>
      </MediaCard>,
    );
    expect(screen.getByTestId('media-card-media')).toHaveClass(
      'w-full',
      'aspect-square',
    );
  });

  it('frames a circle shape inside the card padding instead of edge to edge', () => {
    renderElement(
      <MediaCard>
        <MediaCard.Media shape="circle" dataTestId="media-card-media">
          <img src="/avatar.jpg" alt="Author photo" />
        </MediaCard.Media>
      </MediaCard>,
    );
    const media = screen.getByTestId('media-card-media');
    expect(media).toHaveClass(
      'size-28',
      'rounded-full',
      'mt-card-y',
      'mx-card-x',
    );
    expect(media).not.toHaveClass('w-full');
  });

  it('frames an icon shape as a tile inside the card padding, styled for currentColor children', () => {
    renderElement(
      <MediaCard>
        <MediaCard.Media shape="icon" dataTestId="media-card-media">
          <span data-testid="glyph" />
        </MediaCard.Media>
      </MediaCard>,
    );
    const media = screen.getByTestId('media-card-media');
    expect(media).toHaveClass(
      'size-12',
      'rounded-md',
      'mt-card-y',
      'mx-card-x',
      'bg-brand-primary-muted',
      'text-brand-primary',
    );
    expect(media).not.toHaveClass('w-full');
  });

  it('centres every row of the card when align is center, including meta and footer', () => {
    renderElement(
      <MediaCard
        align="center"
        excerpt="A short summary."
        tags={['react']}
        dataTestId="media-card"
      >
        <MediaCard.Meta
          dateValue="2024-01-01"
          dateLabel="Jan 1, 2024"
          dataTestId="media-card-meta"
        />
        <MediaCard.Title level={3}>
          <a href="/posts/hello-world">Hello World</a>
        </MediaCard.Title>
        <MediaCard.Footer
          authorName="Jane Doe"
          dataTestId="media-card-footer"
        />
      </MediaCard>,
    );
    const content = screen.getByTestId('media-card-content');
    expect(content).toHaveClass('items-center', 'text-center');
    expect(content).toContainElement(screen.getByTestId('media-card-meta'));
    expect(content).toContainElement(screen.getByRole('heading', { level: 3 }));
    expect(content).toContainElement(screen.getByText('A short summary.'));
    expect(content).toContainElement(screen.getByText('react'));
    expect(content).toContainElement(screen.getByTestId('media-card-footer'));
  });

  it('does not centre the card content when align is left (default)', () => {
    renderElement(<MediaCard dataTestId="media-card" />);
    expect(screen.getByTestId('media-card-content')).not.toHaveClass(
      'items-center',
    );
  });

  it('centres an inset circle/icon frame by cloning align onto MediaCard.Media, the same mechanism used for isLead', () => {
    renderElement(
      <MediaCard align="center">
        <MediaCard.Media shape="circle" dataTestId="media-card-media">
          <img src="/avatar.jpg" alt="Author photo" />
        </MediaCard.Media>
      </MediaCard>,
    );
    const media = screen.getByTestId('media-card-media');
    expect(media).toHaveClass('mx-auto');
    expect(media).not.toHaveClass('mx-card-x');
  });

  it('leaves the circle shape unaffected by isLead, since no compound variant targets it', () => {
    const { unmount } = renderElement(
      <MediaCard>
        <MediaCard.Media shape="circle" dataTestId="media-card-media">
          <img src="/avatar.jpg" alt="Author photo" />
        </MediaCard.Media>
      </MediaCard>,
    );
    const withoutLead = screen.getByTestId('media-card-media').className;
    unmount();

    renderElement(
      <MediaCard isLead={true}>
        <MediaCard.Media shape="circle" dataTestId="media-card-media">
          <img src="/avatar.jpg" alt="Author photo" />
        </MediaCard.Media>
      </MediaCard>,
    );
    expect(screen.getByTestId('media-card-media').className).toBe(withoutLead);
  });

  it('leaves the icon shape unaffected by isLead, since no compound variant targets it', () => {
    const { unmount } = renderElement(
      <MediaCard>
        <MediaCard.Media shape="icon" dataTestId="media-card-media">
          <span data-testid="glyph" />
        </MediaCard.Media>
      </MediaCard>,
    );
    const withoutLead = screen.getByTestId('media-card-media').className;
    unmount();

    renderElement(
      <MediaCard isLead={true}>
        <MediaCard.Media shape="icon" dataTestId="media-card-media">
          <span data-testid="glyph" />
        </MediaCard.Media>
      </MediaCard>,
    );
    expect(screen.getByTestId('media-card-media').className).toBe(withoutLead);
  });

  it('wraps a circle-shaped media in the split container without stretching the inset frame', () => {
    renderElement(
      <MediaCard isSplit={true}>
        <MediaCard.Media shape="circle" dataTestId="media-card-media">
          <img src="/avatar.jpg" alt="Author photo" />
        </MediaCard.Media>
      </MediaCard>,
    );
    const media = screen.getByTestId('media-card-media');
    expect(media.parentElement).toHaveClass('md:w-1/2');
    expect(media).toHaveClass('size-28', 'rounded-full', 'mx-card-x');
    expect(media).not.toHaveClass('w-full');
  });

  it('wraps an icon-shaped media in the split container without stretching the inset frame', () => {
    renderElement(
      <MediaCard isSplit={true}>
        <MediaCard.Media shape="icon" dataTestId="media-card-media">
          <span data-testid="glyph" />
        </MediaCard.Media>
      </MediaCard>,
    );
    const media = screen.getByTestId('media-card-media');
    expect(media.parentElement).toHaveClass('md:w-1/2');
    expect(media).toHaveClass('size-12', 'rounded-md', 'mx-card-x');
    expect(media).not.toHaveClass('w-full');
  });
});
