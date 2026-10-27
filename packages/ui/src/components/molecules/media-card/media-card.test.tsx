import { renderElement, screen } from '@blog/ui/testing/custom-render';
import {
  MOCK_FORMATTED_DATE,
  MOCK_PERSON_NAME,
  MOCK_PUBLISHED_AT,
} from '@blog/ui/testing/fixtures';
import { faker } from '@faker-js/faker';

import { MediaCard } from './media-card';

faker.seed(123);

const MEDIA_TEST_ID = 'media-card-media';
const MOCK_POST_HREF = `/posts/${faker.lorem.slug()}`;
const MOCK_TITLE = faker.lorem.words(3);
const MOCK_COVER_SRC = faker.image.url();
const MOCK_COVER_ALT = faker.lorem.words(2);
const MOCK_EXCERPT = faker.lorem.sentence();
const MOCK_TAGS = [faker.lorem.word(), faker.lorem.word()];
const MOCK_TOPIC = faker.commerce.department();
const MOCK_STRAY_TEXT = faker.lorem.words(2);
const MOCK_CONTROL_LABEL = faker.lorem.word();
const MOCK_CONTROL_HREF = faker.internet.url();
const MOCK_CARD_LINK_LABEL = faker.person.fullName();
const MOCK_CARD_LINK_HREF = `/team/${faker.lorem.slug()}`;
const MOCK_LEADING_ICON = 'L';
const MOCK_TRAILING_ICON = 'R';

const renderMediaCard = () =>
  renderElement(
    <MediaCard>
      <MediaCard.Media dataTestId={MEDIA_TEST_ID}>
        <img src={MOCK_COVER_SRC} alt={MOCK_COVER_ALT} />
      </MediaCard.Media>
    </MediaCard>,
  );

describe(`<${MediaCard.name}/>`, () => {
  it.each([2, 3] as const)(
    'renders MediaCard.Title at heading level %s',
    (level) => {
      renderElement(
        <MediaCard>
          <MediaCard.Title level={level}>
            <a href={MOCK_POST_HREF}>{MOCK_TITLE}</a>
          </MediaCard.Title>
        </MediaCard>,
      );

      const heading = screen.getByRole('heading', { level });

      expect(heading).toBeVisible();
    },
  );

  it('renders MediaCard.Media content', () => {
    renderMediaCard();

    const image = screen.getByRole('img', { name: MOCK_COVER_ALT });

    expect(image).toBeVisible();
  });

  it('renders the excerpt when provided', () => {
    renderElement(<MediaCard excerpt={MOCK_EXCERPT} />);

    const excerpt = screen.getByText(MOCK_EXCERPT);

    expect(excerpt).toBeVisible();
  });

  describe('with no props', () => {
    beforeEach(() => {
      renderElement(<MediaCard />);
    });

    it('renders no media', () => {
      const image = screen.queryByRole('img');

      expect(image).not.toBeInTheDocument();
    });

    it('renders no excerpt', () => {
      const excerpt = screen.queryByText(MOCK_EXCERPT);

      expect(excerpt).not.toBeInTheDocument();
    });

    it('renders no author', () => {
      const authorName = screen.queryByText(MOCK_PERSON_NAME);

      expect(authorName).not.toBeInTheDocument();
    });
  });

  it.each(MOCK_TAGS)('renders the "%s" tag', (tagName) => {
    renderElement(<MediaCard tags={MOCK_TAGS} />);

    const tag = screen.getByText(tagName);

    expect(tag).toBeVisible();
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

  it('renders a time element with the date and display text', () => {
    renderElement(
      <MediaCard>
        <MediaCard.Footer
          publishedAt={MOCK_PUBLISHED_AT}
          formattedDate={MOCK_FORMATTED_DATE}
        />
      </MediaCard>,
    );

    const time = screen.getByRole('time');

    expect(time).toBeVisible();
    expect(time).toHaveAttribute('dateTime', MOCK_PUBLISHED_AT);
    expect(time).toHaveTextContent(MOCK_FORMATTED_DATE);
  });

  it.each([
    { omitted: 'publishedAt', footer: { formattedDate: MOCK_FORMATTED_DATE } },
    { omitted: 'formattedDate', footer: { publishedAt: MOCK_PUBLISHED_AT } },
  ])('renders no time element without $omitted', ({ footer }) => {
    renderElement(
      <MediaCard>
        <MediaCard.Footer {...footer} />
      </MediaCard>,
    );

    const time = screen.queryByRole('time');

    expect(time).not.toBeInTheDocument();
  });

  it('renders unmatched children without dropping them', () => {
    renderElement(
      <MediaCard>
        <span>{MOCK_STRAY_TEXT}</span>
      </MediaCard>,
    );

    const strayContent = screen.getByText(MOCK_STRAY_TEXT);

    expect(strayContent).toBeVisible();
  });

  it('renders MediaCard.Meta content', () => {
    renderElement(
      <MediaCard>
        <MediaCard.Meta
          dateValue={MOCK_PUBLISHED_AT}
          dateLabel={MOCK_FORMATTED_DATE}
        />
      </MediaCard>,
    );

    const dateLabel = screen.getByText(MOCK_FORMATTED_DATE);

    expect(dateLabel).toBeVisible();
  });

  it('renders the Footer topic lowercased', () => {
    renderElement(
      <MediaCard>
        <MediaCard.Footer topic={MOCK_TOPIC} />
      </MediaCard>,
    );

    const topic = screen.getByText(MOCK_TOPIC.toLowerCase());

    expect(topic).toBeVisible();
  });

  it('renders leading and trailing icons around the topic text', () => {
    renderElement(
      <MediaCard>
        <MediaCard.Footer
          topic={MOCK_TOPIC}
          leadingIcon={<span aria-hidden="true">{MOCK_LEADING_ICON}</span>}
          trailingIcon={<span aria-hidden="true">{MOCK_TRAILING_ICON}</span>}
        />
      </MediaCard>,
    );

    const topic = screen.getByText(MOCK_TOPIC.toLowerCase());

    expect(topic).toHaveTextContent(
      `${MOCK_LEADING_ICON} ${MOCK_TOPIC.toLowerCase()} ${MOCK_TRAILING_ICON}`,
    );
  });

  it('renders MediaCard.Link inside the title as the card link', () => {
    renderElement(
      <MediaCard>
        <MediaCard.Title level={3}>
          <MediaCard.Link href={MOCK_POST_HREF}>{MOCK_TITLE}</MediaCard.Link>
        </MediaCard.Title>
      </MediaCard>,
    );

    const cardLink = screen.getByRole('link', { name: MOCK_TITLE });

    expect(cardLink).toHaveAttribute('href', MOCK_POST_HREF);
  });

  it('renders controls passed to MediaCard.Footer alongside the card link', () => {
    renderElement(
      <MediaCard>
        <MediaCard.Title level={3}>
          <MediaCard.Link href={MOCK_CARD_LINK_HREF}>
            {MOCK_CARD_LINK_LABEL}
          </MediaCard.Link>
        </MediaCard.Title>
        <MediaCard.Footer>
          <a href={MOCK_CONTROL_HREF}>{MOCK_CONTROL_LABEL}</a>
        </MediaCard.Footer>
      </MediaCard>,
    );

    const control = screen.getByRole('link', { name: MOCK_CONTROL_LABEL });
    const cardLink = screen.getByRole('link', { name: MOCK_CARD_LINK_LABEL });

    expect(control).toHaveAttribute('href', MOCK_CONTROL_HREF);
    expect(cardLink).toBeVisible();
  });
});
