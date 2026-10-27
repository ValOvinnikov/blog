import { renderElement, screen } from '@blog/ui/testing/custom-render';
import {
  MOCK_FORMATTED_DATE,
  MOCK_PERSON_NAME,
  MOCK_PUBLISHED_AT,
} from '@blog/ui/testing/fixtures';
import { cloneElement, type ComponentProps } from 'react';

import { MediaCard } from './media-card';

const POST_HREF = '/posts/hello-world';
const MEDIA_TEST_ID = 'media-card-media';

type TMediaCardChildren = ComponentProps<typeof MediaCard>['children'];

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
      const heading = screen.getByRole('heading', { level: 3 });
      const link = screen.getByRole('link');

      expect(heading).toBeVisible();
      expect(link).toHaveAttribute('href', POST_HREF);
    });

    it('does not render media when MediaCard.Media is omitted', () => {
      const image = screen.queryByRole('img');

      expect(image).not.toBeInTheDocument();
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
    const heading = screen.getByRole('heading', { level: 2 });
    const levelThreeHeading = screen.queryByRole('heading', { level: 3 });

    expect(heading).toBeVisible();
    expect(levelThreeHeading).not.toBeInTheDocument();
  });

  it('renders MediaCard.Media content', () => {
    renderElement(
      <MediaCard>
        <MediaCard.Media>
          <img src="/cover.jpg" alt="Cover photo" />
        </MediaCard.Media>
      </MediaCard>,
    );
    const image = screen.getByRole('img', { name: 'Cover photo' });

    expect(image).toBeVisible();
  });

  it('renders excerpt when provided', () => {
    renderElement(<MediaCard excerpt="A short summary." />);
    const excerpt = screen.getByText('A short summary.');

    expect(excerpt).toBeVisible();
  });

  describe('with no props', () => {
    beforeEach(() => {
      renderElement(<MediaCard />);
    });

    it('does not render excerpt element when omitted', () => {
      const excerpt = screen.queryByText(/summary/i);

      expect(excerpt).not.toBeInTheDocument();
    });

    it('does not render author section when authorName is omitted', () => {
      const authorName = screen.queryByText(MOCK_PERSON_NAME);

      expect(authorName).not.toBeInTheDocument();
    });
  });

  it('renders all provided tags', () => {
    renderElement(<MediaCard tags={['react', 'typescript']} />);
    const reactTag = screen.getByText('react');
    const typescriptTag = screen.getByText('typescript');

    expect(reactTag).toBeVisible();
    expect(typescriptTag).toBeVisible();
  });

  it('announces the Footer author name once, beside its Avatar', () => {
    renderElement(
      <MediaCard>
        <MediaCard.Footer authorName={MOCK_PERSON_NAME} />
      </MediaCard>,
    );
    const authorNames = screen.getAllByText(MOCK_PERSON_NAME);

    expect(authorNames).toHaveLength(1);
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
      const timeEl = screen.queryByRole('time');

      expect(timeEl).not.toBeInTheDocument();
    },
  );

  it('renders unmatched children without dropping them', () => {
    renderElement(
      <MediaCard>
        <span>stray content</span>
      </MediaCard>,
    );
    const strayContent = screen.getByText('stray content');

    expect(strayContent).toBeVisible();
  });

  it('renders MediaCard.Meta content', () => {
    renderElement(
      <MediaCard>
        <MediaCard.Meta dateValue="2024-01-01" dateLabel="Jan 1, 2024" />
      </MediaCard>,
    );
    const dateLabel = screen.getByText('Jan 1, 2024');

    expect(dateLabel).toBeVisible();
  });

  it('renders the topic lowercased via MediaCard.Footer', () => {
    renderElement(
      <MediaCard>
        <MediaCard.Footer topic="Design Systems" />
      </MediaCard>,
    );
    const topicText = screen.getByText(/design systems/);

    expect(topicText).toBeVisible();
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
    const cardLink = screen.getByRole('link', { name: 'Hello World' });

    expect(cardLink).toHaveAttribute('href', POST_HREF);
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
    const githubLink = screen.getByRole('link', { name: 'GitHub' });
    const cardLink = screen.getByRole('link', { name: 'Ada Lovelace' });

    expect(githubLink).toHaveAttribute('href', 'https://github.com/ada');
    expect(cardLink).toBeVisible();
  });

  it('forwards data-testid to root element', () => {
    renderElement(<MediaCard dataTestId="media-card" />);
    const root = screen.getByTestId('media-card');

    expect(root).toBeVisible();
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
      // eslint-disable-next-line testing-library/no-node-access -- TODO: #6013
      expect(media.parentElement).not.toBe(article);
      // eslint-disable-next-line testing-library/no-node-access -- TODO: #6013
      expect(media.parentElement?.parentElement).toBe(article);
    } else {
      // eslint-disable-next-line testing-library/no-node-access -- TODO: #6013
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
      const media = screen.getByTestId(MEDIA_TEST_ID);

      expect(cloneElement).not.toHaveBeenCalled();
      expect(media).toBeVisible();
    });

    it.each([
      {
        name: 'isLead is set',
        renderCard: (media: TMediaCardChildren) => (
          <MediaCard isLead={true}>{media}</MediaCard>
        ),
      },
      {
        name: 'align is "center"',
        renderCard: (media: TMediaCardChildren) => (
          <MediaCard align="center">{media}</MediaCard>
        ),
      },
    ])('clones the Media slot when $name', ({ renderCard }) => {
      renderElement(
        renderCard(
          <MediaCard.Media dataTestId={MEDIA_TEST_ID}>
            <img src="/cover.jpg" alt="Cover photo" />
          </MediaCard.Media>,
        ),
      );
      expect(cloneElement).toHaveBeenCalledTimes(1);
    });
  });
});
