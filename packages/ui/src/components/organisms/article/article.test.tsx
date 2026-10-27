import { renderElement, screen } from '@blog/ui/testing/custom-render';
import {
  MOCK_FORMATTED_DATE,
  MOCK_PERSON_NAME,
  MOCK_POST_EXCERPT,
  MOCK_POST_TITLE,
  MOCK_PUBLISHED_AT,
  MOCK_TAG,
  MOCK_TOPIC,
} from '@blog/ui/testing/fixtures';
import { faker } from '@faker-js/faker';
import type { ComponentProps } from 'react';

import { Article } from './article';

faker.seed(123);

const MOCK_OTHER_TAG = {
  label: faker.lorem.words(3),
  href: `/tags/${faker.lorem.slug(3)}`,
};
const MOCK_FOOTER_TAGS = [MOCK_TAG, MOCK_OTHER_TAG];
const MOCK_POST_BODY = faker.lorem.sentence();
const MOCK_COVER_ALT = faker.lorem.words(3);
const MOCK_COVER_SRC = faker.image.url();

const meta = {
  author: { name: MOCK_PERSON_NAME },
  publishedAt: MOCK_PUBLISHED_AT,
  formattedDate: MOCK_FORMATTED_DATE,
};

const renderArticle = (
  header: Partial<ComponentProps<typeof Article.Header>> = {},
  footer?: ComponentProps<typeof Article.Footer>,
) =>
  renderElement(
    <Article>
      <Article.Header title={MOCK_POST_TITLE} meta={meta} {...header} />
      <Article.Body>
        <p>{MOCK_POST_BODY}</p>
      </Article.Body>
      {footer && <Article.Footer {...footer} />}
    </Article>,
  );

describe(`<${Article.name}/>`, () => {
  describe('with a title, meta and body only', () => {
    beforeEach(() => {
      renderArticle();
    });

    it('renders as an <article> landmark wrapping Header and Body', () => {
      const article = screen.getByRole('article');
      const title = screen.getByRole('heading', {
        level: 1,
        name: MOCK_POST_TITLE,
      });
      const body = screen.getByText(MOCK_POST_BODY);
      expect(article).toBeVisible();
      expect(title).toBeVisible();
      expect(body).toBeVisible();
    });

    it('renders no topic eyebrow when none is given', () => {
      const link = screen.queryByRole('link');
      expect(link).not.toBeInTheDocument();
    });

    it('renders no lead paragraph when none is given', () => {
      const lead = screen.queryByText(MOCK_POST_EXCERPT);
      expect(lead).not.toBeInTheDocument();
    });

    it('renders no cover image when none is given', () => {
      const coverImage = screen.queryByRole('img');
      expect(coverImage).not.toBeInTheDocument();
    });
  });

  it('renders a topic without an href as plain text', () => {
    renderArticle({ topic: { label: MOCK_TOPIC.label } });
    const eyebrow = screen.getByText(MOCK_TOPIC.label);
    const eyebrowLink = screen.queryByRole('link', { name: MOCK_TOPIC.label });
    const eyebrowHeading = screen.queryByRole('heading', {
      name: MOCK_TOPIC.label,
    });
    expect(eyebrow).toBeVisible();
    expect(eyebrowLink).not.toBeInTheDocument();
    expect(eyebrowHeading).not.toBeInTheDocument();
  });

  describe('with a linked topic eyebrow', () => {
    beforeEach(() => {
      renderArticle({ topic: MOCK_TOPIC });
    });

    it('renders a topic with an href as a link to it', () => {
      const eyebrowLink = screen.getByRole('link', { name: MOCK_TOPIC.label });
      expect(eyebrowLink).toHaveAttribute('href', MOCK_TOPIC.href);
    });

    it('keeps the post title as the only h1 when a topic eyebrow is present', () => {
      const titleHeadings = screen.getAllByRole('heading', { level: 1 });
      expect(titleHeadings).toHaveLength(1);
    });
  });

  it('renders the lead paragraph when provided', () => {
    renderArticle({ lead: MOCK_POST_EXCERPT });
    const lead = screen.getByText(MOCK_POST_EXCERPT);
    expect(lead).toBeVisible();
  });

  it('renders no author or date when meta is omitted', () => {
    renderArticle({ meta: undefined });
    const authorName = screen.queryByText(meta.author.name);
    const formattedDate = screen.queryByText(meta.formattedDate);
    expect(authorName).not.toBeInTheDocument();
    expect(formattedDate).not.toBeInTheDocument();
  });

  it('renders the cover media when provided', () => {
    renderArticle({
      coverMedia: <img src={MOCK_COVER_SRC} alt={MOCK_COVER_ALT} />,
    });
    const coverImage = screen.getByAltText(MOCK_COVER_ALT);
    expect(coverImage).toBeVisible();
  });

  it('renders the footer tags as links to their routes', () => {
    renderArticle({}, { tags: MOCK_FOOTER_TAGS });
    for (const tag of MOCK_FOOTER_TAGS) {
      const tagLink = screen.getByRole('link', { name: tag.label });
      expect(tagLink).toHaveAttribute('href', tag.href);
    }
  });

  it('renders no footer links when tags is empty', () => {
    renderArticle({}, { tags: [] });
    const link = screen.queryByRole('link');
    expect(link).not.toBeInTheDocument();
  });
});
