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

const TYPESCRIPT_HREF = '/tag/typescript';
const TESTING_HREF = '/tag/testing';

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
      expect(screen.getByRole('article')).toBeVisible();
      expect(
        screen.getByRole('heading', { level: 1, name: MOCK_POST_TITLE }),
      ).toBeVisible();
      expect(screen.getByText(POST_BODY)).toBeVisible();
    });

    it('renders no topic eyebrow when topic is omitted', () => {
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    it('does not render a lead paragraph when omitted', () => {
      expect(screen.queryByText(MOCK_POST_EXCERPT)).not.toBeInTheDocument();
    });

    it('does not render a coverMedia wrapper when omitted', () => {
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
  });

  it('renders the topic eyebrow as non-heading text when no href is given', () => {
    renderArticle({ topic: { label: MOCK_TOPIC.label } });
    expect(screen.getByText(MOCK_TOPIC.label)).toBeVisible();
    expect(
      screen.queryByRole('link', { name: MOCK_TOPIC.label }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: MOCK_TOPIC.label }),
    ).not.toBeInTheDocument();
  });

  describe('with a linked topic eyebrow', () => {
    beforeEach(() => {
      renderArticle({ topic: MOCK_TOPIC });
    });

    it('renders the topic eyebrow as a link when href is given', () => {
      expect(
        screen.getByRole('link', { name: MOCK_TOPIC.label }),
      ).toHaveAttribute('href', MOCK_TOPIC.href);
    });

    it('renders exactly one h1 — the post title — when a topic eyebrow is present', () => {
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    });
  });

  it('renders the lead paragraph when provided', () => {
    renderArticle({ lead: MOCK_POST_EXCERPT });
    expect(screen.getByText(MOCK_POST_EXCERPT)).toBeVisible();
  });

  it('does not render a PostMeta strip when meta is omitted', () => {
    renderArticle({ meta: undefined });
    expect(screen.queryByText(meta.author.name)).not.toBeInTheDocument();
    expect(screen.queryByText(meta.formattedDate)).not.toBeInTheDocument();
  });

  it('renders coverMedia content when provided', () => {
    renderArticle({ coverMedia: <img src="/cover.jpg" alt="Post cover" /> });
    expect(screen.getByAltText('Post cover')).toBeVisible();
  });

  it('renders Article.Footer tags as links to their routes', () => {
    renderArticle(
      {},
      {
        tags: [
          { label: 'TypeScript', href: TYPESCRIPT_HREF },
          { label: 'Testing', href: TESTING_HREF },
        ],
      },
    );
    expect(screen.getByRole('link', { name: 'TypeScript' })).toHaveAttribute(
      'href',
      TYPESCRIPT_HREF,
    );
    expect(screen.getByRole('link', { name: 'Testing' })).toHaveAttribute(
      'href',
      TESTING_HREF,
    );
  });

  it('does not render an Article.Footer when tags is empty', () => {
    renderArticle({}, { tags: [] });
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('forwards dataTestId to the root element', () => {
    renderElement(
      <Article dataTestId="article">
        <Article.Header title={MOCK_POST_TITLE} meta={meta} />
      </Article>,
    );
    expect(screen.getByTestId('article')).toBeVisible();
  });
});
