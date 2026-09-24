import { renderElement, screen } from '@blog/ui/testing/custom-render';
import { cloneElement } from 'react';

import { MediaCard } from './media-card';

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return { ...actual, cloneElement: vi.fn(actual.cloneElement) };
});

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

  it('renders the author name once as visible text in the Footer, with the Avatar contributing no duplicate accessible name', () => {
    renderElement(
      <MediaCard>
        <MediaCard.Footer authorName="Jane Doe" />
      </MediaCard>,
    );
    expect(screen.getAllByText('Jane Doe')).toHaveLength(1);
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

  it.each([
    {
      name: 'wraps MediaCard.Media in a split container only when isSplit is set and Media is present',
      isSplit: true,
    },
    {
      name: 'renders MediaCard.Media as a direct child of the article when isSplit is unset',
      isSplit: undefined,
    },
  ])('$name', ({ isSplit }) => {
    renderElement(
      <MediaCard isSplit={isSplit}>
        <MediaCard.Media dataTestId="media-card-media">
          <img src="/cover.jpg" alt="Cover photo" />
        </MediaCard.Media>
      </MediaCard>,
    );
    const media = screen.getByTestId('media-card-media');
    const article = screen.getByRole('article');

    if (isSplit) {
      expect(media.parentElement).not.toBe(article);
      expect(media.parentElement?.parentElement).toBe(article);
    } else {
      expect(media.parentElement).toBe(article);
    }
  });

  describe('cloning the Media slot', () => {
    beforeEach(() => {
      vi.mocked(cloneElement).mockClear();
    });

    it('passes the Media slot through unmodified when isLead is unset and align is not center', () => {
      renderElement(
        <MediaCard>
          <MediaCard.Media dataTestId="media-card-media">
            <img src="/cover.jpg" alt="Cover photo" />
          </MediaCard.Media>
        </MediaCard>,
      );
      expect(cloneElement).not.toHaveBeenCalled();
      expect(screen.getByTestId('media-card-media')).toBeVisible();
    });

    it('clones the Media slot when isLead is set', () => {
      renderElement(
        <MediaCard isLead={true}>
          <MediaCard.Media dataTestId="media-card-media">
            <img src="/cover.jpg" alt="Cover photo" />
          </MediaCard.Media>
        </MediaCard>,
      );
      expect(cloneElement).toHaveBeenCalledTimes(1);
    });

    it('clones the Media slot when align is "center"', () => {
      renderElement(
        <MediaCard align="center">
          <MediaCard.Media dataTestId="media-card-media">
            <img src="/cover.jpg" alt="Cover photo" />
          </MediaCard.Media>
        </MediaCard>,
      );
      expect(cloneElement).toHaveBeenCalledTimes(1);
    });
  });
});
