import { renderElement, screen } from '@blog/ui/testing/custom-render';
import {
  MOCK_FORMATTED_DATE,
  MOCK_PERSON_NAME,
  MOCK_PUBLISHED_AT,
} from '@blog/ui/testing/fixtures';
import { cloneElement } from 'react';

import { MediaCard } from './media-card';

const POST_HREF = '/posts/hello-world';
const MEDIA_TEST_ID = 'media-card-media';

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return { ...actual, cloneElement: vi.fn(actual.cloneElement) };
});

describe(`<${MediaCard.name}/>`, () => {
  describe('with only a level-3 title', () => {
    beforeEach(() => {
      renderElement(
        <MediaCard>
          <MediaCard.Title level={3}>
            <a href={POST_HREF}>Hello World</a>
          </MediaCard.Title>
        </MediaCard>,
      );
    });

    it('renders MediaCard.Title at the caller-specified heading level', () => {
      expect(screen.getByRole('heading', { level: 3 })).toBeVisible();
      expect(screen.getByRole('link')).toHaveAttribute('href', POST_HREF);
    });

    it('does not render media when MediaCard.Media is omitted', () => {
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
  });

  it('renders MediaCard.Title at a different caller-specified heading level', () => {
    renderElement(
      <MediaCard>
        <MediaCard.Title level={2}>
          <a href={POST_HREF}>Hello World</a>
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

  it('renders excerpt when provided', () => {
    renderElement(<MediaCard excerpt="A short summary." />);
    expect(screen.getByText('A short summary.')).toBeVisible();
  });

  describe('with no props', () => {
    beforeEach(() => {
      renderElement(<MediaCard />);
    });

    it('does not render excerpt element when omitted', () => {
      expect(screen.queryByText(/summary/i)).not.toBeInTheDocument();
    });

    it('does not render author section when authorName is omitted', () => {
      expect(screen.queryByText(MOCK_PERSON_NAME)).not.toBeInTheDocument();
    });
  });

  it('renders all provided tags', () => {
    renderElement(<MediaCard tags={['react', 'typescript']} />);
    expect(screen.getByText('react')).toBeVisible();
    expect(screen.getByText('typescript')).toBeVisible();
  });

  it('announces the Footer author name once, beside its Avatar', () => {
    renderElement(
      <MediaCard>
        <MediaCard.Footer authorName={MOCK_PERSON_NAME} />
      </MediaCard>,
    );
    expect(screen.getAllByText(MOCK_PERSON_NAME)).toHaveLength(1);
  });

  it('renders a time element with the correct dateTime and display text', () => {
    renderElement(
      <MediaCard>
        <MediaCard.Footer
          publishedAt={MOCK_PUBLISHED_AT}
          formattedDate={MOCK_FORMATTED_DATE}
        />
      </MediaCard>,
    );
    const timeEl = screen.getByRole('time');
    expect(timeEl).toBeVisible();
    expect(timeEl).toHaveAttribute('dateTime', MOCK_PUBLISHED_AT);
    expect(timeEl).toHaveTextContent(MOCK_FORMATTED_DATE);
  });

  it.each([
    { omitted: 'publishedAt', footer: { formattedDate: MOCK_FORMATTED_DATE } },
    { omitted: 'formattedDate', footer: { publishedAt: MOCK_PUBLISHED_AT } },
  ])(
    'does not render a time element when $omitted is omitted',
    ({ footer }) => {
      renderElement(
        <MediaCard>
          <MediaCard.Footer {...footer} />
        </MediaCard>,
      );
      expect(screen.queryByRole('time')).not.toBeInTheDocument();
    },
  );

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

  it('renders MediaCard.Link inside the title as the card link', () => {
    renderElement(
      <MediaCard>
        <MediaCard.Title level={3}>
          <MediaCard.Link href={POST_HREF}>Hello World</MediaCard.Link>
        </MediaCard.Title>
      </MediaCard>,
    );
    expect(screen.getByRole('link', { name: 'Hello World' })).toHaveAttribute(
      'href',
      POST_HREF,
    );
  });

  it('renders controls passed to MediaCard.Footer alongside the card link', () => {
    renderElement(
      <MediaCard>
        <MediaCard.Title level={3}>
          <MediaCard.Link href="/team/ada">Ada Lovelace</MediaCard.Link>
        </MediaCard.Title>
        <MediaCard.Footer>
          <a href="https://github.com/ada">GitHub</a>
        </MediaCard.Footer>
      </MediaCard>,
    );
    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/ada',
    );
    expect(screen.getByRole('link', { name: 'Ada Lovelace' })).toBeVisible();
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
        <MediaCard.Media dataTestId={MEDIA_TEST_ID}>
          <img src="/cover.jpg" alt="Cover photo" />
        </MediaCard.Media>
      </MediaCard>,
    );
    const media = screen.getByTestId(MEDIA_TEST_ID);
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

    it('passes the Media slot through unmodified when neither lead nor centred', () => {
      renderElement(
        <MediaCard>
          <MediaCard.Media dataTestId={MEDIA_TEST_ID}>
            <img src="/cover.jpg" alt="Cover photo" />
          </MediaCard.Media>
        </MediaCard>,
      );
      expect(cloneElement).not.toHaveBeenCalled();
      expect(screen.getByTestId(MEDIA_TEST_ID)).toBeVisible();
    });

    it.each([
      { name: 'isLead is set', props: { isLead: true } },
      { name: 'align is "center"', props: { align: 'center' as const } },
    ])('clones the Media slot when $name', ({ props }) => {
      renderElement(
        <MediaCard {...props}>
          <MediaCard.Media dataTestId={MEDIA_TEST_ID}>
            <img src="/cover.jpg" alt="Cover photo" />
          </MediaCard.Media>
        </MediaCard>,
      );
      expect(cloneElement).toHaveBeenCalledTimes(1);
    });
  });
});
