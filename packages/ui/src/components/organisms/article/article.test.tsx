import { renderElement, screen } from '@blog/ui/testing/custom-render';
import {
  MOCK_FORMATTED_DATE,
  MOCK_PERSON_NAME,
  MOCK_POST_EXCERPT,
  MOCK_POST_TITLE,
  MOCK_PUBLISHED_AT,
  MOCK_TOPIC,
} from '@blog/ui/testing/fixtures';
import type { ComponentProps } from 'react';

import { Article } from './article';

const FOOTER_TAGS = [
  { label: 'TypeScript', href: '/tag/typescript' },
  { label: 'Testing', href: '/tag/testing' },
];

const meta = {
  author: { name: MOCK_PERSON_NAME },
  publishedAt: MOCK_PUBLISHED_AT,
  formattedDate: MOCK_FORMATTED_DATE,
};

const POST_BODY = 'Post body content.';

const renderArticle = (
  header: Partial<ComponentProps<typeof Article.Header>> = {},
  footer?: ComponentProps<typeof Article.Footer>,
) =>
  renderElement(
    <Article>
      <Article.Header title={MOCK_POST_TITLE} meta={meta} {...header} />
      <Article.Body>
        <p>{POST_BODY}</p>
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
      const body = screen.getByText(POST_BODY);
      expect(article).toBeVisible();
      expect(title).toBeVisible();
      expect(body).toBeVisible();
    });

    it('renders no topic eyebrow when topic is omitted', () => {
      const link = screen.queryByRole('link');
      expect(link).not.toBeInTheDocument();
    });

    it('does not render a lead paragraph when omitted', () => {
      const lead = screen.queryByText(MOCK_POST_EXCERPT);
      expect(lead).not.toBeInTheDocument();
    });

    it('does not render a coverMedia wrapper when omitted', () => {
      const coverImage = screen.queryByRole('img');
      expect(coverImage).not.toBeInTheDocument();
    });
  });

  it('renders the topic eyebrow as non-heading text when no href is given', () => {
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

    it('renders the topic eyebrow as a link when href is given', () => {
      const eyebrowLink = screen.getByRole('link', { name: MOCK_TOPIC.label });
      expect(eyebrowLink).toHaveAttribute('href', MOCK_TOPIC.href);
    });

    it('renders exactly one h1 — the post title — when a topic eyebrow is present', () => {
      const titleHeadings = screen.getAllByRole('heading', { level: 1 });
      expect(titleHeadings).toHaveLength(1);
    });
  });

  it('renders the lead paragraph when provided', () => {
    renderArticle({ lead: MOCK_POST_EXCERPT });
    const lead = screen.getByText(MOCK_POST_EXCERPT);
    expect(lead).toBeVisible();
  });

  it('does not render a PostMeta strip when meta is omitted', () => {
    renderArticle({ meta: undefined });
    const authorName = screen.queryByText(meta.author.name);
    const formattedDate = screen.queryByText(meta.formattedDate);
    expect(authorName).not.toBeInTheDocument();
    expect(formattedDate).not.toBeInTheDocument();
  });

  it('renders coverMedia content when provided', () => {
    renderArticle({ coverMedia: <img src="/cover.jpg" alt="Post cover" /> });
    const coverImage = screen.getByAltText('Post cover');
    expect(coverImage).toBeVisible();
  });

  it('renders Article.Footer tags as links to their routes', () => {
    renderArticle({}, { tags: FOOTER_TAGS });
    for (const tag of FOOTER_TAGS) {
      const tagLink = screen.getByRole('link', { name: tag.label });
      expect(tagLink).toHaveAttribute('href', tag.href);
    }
  });

  it('does not render an Article.Footer when tags is empty', () => {
    renderArticle({}, { tags: [] });
    const link = screen.queryByRole('link');
    expect(link).not.toBeInTheDocument();
  });

  it('forwards dataTestId to the root element', () => {
    renderElement(
      <Article dataTestId="article">
        <Article.Header title={MOCK_POST_TITLE} meta={meta} />
      </Article>,
    );
    const article = screen.getByTestId('article');
    expect(article).toBeVisible();
  });
});
