import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';
import type { ReactNode } from 'react';

import { type IPostCardData, PostsSection } from './posts-section';

faker.seed(123);

const makePost = (): IPostCardData => ({
  id: faker.string.uuid(),
  href: `/posts/${faker.lorem.slug()}`,
  title: faker.lorem.sentence(4),
  excerpt: faker.lorem.paragraph(),
  publishedAt: faker.date.past().toISOString(),
  formattedDate: faker.date.past().toLocaleDateString(),
  topic: { title: faker.lorem.word() },
});

const posts = faker.helpers.multiple(makePost, { count: 3 });

const setup = customRender(PostsSection, {
  title: 'Latest',
  titleId: 'latest-posts',
  posts,
});

describe(`<${PostsSection.name}/>`, () => {
  it('renders the section title as a heading', () => {
    setup();

    expect(
      screen.getByRole('heading', { level: 2, name: 'Latest' }),
    ).toBeVisible();
  });

  it('renders supportingText under the heading when provided', () => {
    const supportingText = faker.lorem.sentence();
    setup({ supportingText });

    expect(screen.getByText(supportingText)).toBeVisible();
  });

  it('does not render supportingText when omitted', () => {
    setup();

    expect(screen.queryByText(faker.lorem.sentence())).not.toBeInTheDocument();
  });

  it('renders a PostCard for each post', () => {
    setup();

    for (const post of posts) {
      expect(
        screen.getByRole('heading', { level: 3, name: post.title }),
      ).toBeVisible();
      expect(screen.getByRole('link', { name: post.title })).toHaveAttribute(
        'href',
        post.href,
      );
    }
  });

  it('returns null when posts is empty and no emptyMessage is provided', () => {
    const { container } = setup({ posts: [] });

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the heading and the empty message when posts is empty and emptyMessage is provided', () => {
    const emptyMessage = faker.lorem.sentence();

    setup({ posts: [], emptyMessage });

    expect(
      screen.getByRole('heading', { level: 2, name: 'Latest' }),
    ).toBeVisible();
    expect(screen.getByText(emptyMessage)).toBeVisible();
    expect(screen.queryAllByRole('link')).toHaveLength(0);
  });

  it('forwards data-testid', () => {
    setup({ dataTestId: 'latest-posts-section' });

    expect(screen.getByTestId('latest-posts-section')).toBeVisible();
  });

  it('renders each post topic lowercased in the footer', () => {
    setup();

    for (const post of posts) {
      expect(
        screen.getByText(post.topic.title.toLowerCase(), {
          exact: false,
        }),
      ).toBeVisible();
    }
  });

  it('renders a trailing arrow icon in each post topic footer', () => {
    setup();

    expect(screen.getAllByTestId('post-card-footer-arrow')).toHaveLength(
      posts.length,
    );
  });

  it('renders readingTime when provided on a post', () => {
    const readingTime = `${faker.number.int({ min: 3, max: 15 })} min`;
    const postsWithReadingTime = posts.map((post, index) =>
      index === 0 ? { ...post, readingTime } : post,
    );

    setup({ posts: postsWithReadingTime });

    expect(screen.getByText(readingTime)).toBeVisible();
  });

  it('renders fine without readingTime on a post', () => {
    setup();

    for (const post of posts) {
      expect(
        screen.getByRole('heading', { level: 3, name: post.title }),
      ).toBeVisible();
    }
  });

  it('renders each title link via linkAs when provided', () => {
    const CustomLink = ({
      href,
      children,
    }: {
      href: string;
      children?: ReactNode;
    }) => (
      <a href={href} data-testid="custom-link">
        {children}
      </a>
    );

    setup({ linkAs: CustomLink });

    expect(screen.getAllByTestId('custom-link')).toHaveLength(posts.length);
  });

  it('keeps the h2 heading markup unchanged when tinted', () => {
    setup({ isTinted: true });

    expect(
      screen.getByRole('heading', { level: 2, name: 'Latest' }),
    ).toBeVisible();
  });

  it('renders the same structure when wrapped', () => {
    setup({ isWrapped: true });

    expect(
      screen.getByRole('heading', { level: 2, name: 'Latest' }),
    ).toBeVisible();
    for (const post of posts) {
      expect(
        screen.getByRole('heading', { level: 3, name: post.title }),
      ).toBeVisible();
    }
  });

  it('renders no heading when title and titleFallback are both omitted', () => {
    setup({ title: undefined, titleId: undefined });

    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
  });

  it('still renders supportingText, the grid, and each post when title and titleFallback are both omitted', () => {
    const supportingText = faker.lorem.sentence();

    setup({ title: undefined, titleId: undefined, supportingText });

    expect(screen.getByText(supportingText)).toBeVisible();
    for (const post of posts) {
      expect(
        screen.getByRole('heading', { level: 3, name: post.title }),
      ).toBeVisible();
      expect(screen.getByRole('link', { name: post.title })).toHaveAttribute(
        'href',
        post.href,
      );
    }
  });

  it('renders the empty message without a heading when title and titleFallback are both omitted and posts is empty', () => {
    const emptyMessage = faker.lorem.sentence();

    setup({ title: undefined, titleId: undefined, posts: [], emptyMessage });

    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
    expect(screen.getByText(emptyMessage)).toBeVisible();
  });

  it('renders the grid without a heading when title and titleFallback are both omitted and isTinted', () => {
    setup({ title: undefined, titleId: undefined, isTinted: true });

    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
    for (const post of posts) {
      expect(
        screen.getByRole('heading', { level: 3, name: post.title }),
      ).toBeVisible();
    }
  });

  it('renders a visually-hidden heading from titleFallback when title is omitted', () => {
    const titleFallback = faker.lorem.sentence();

    setup({ title: undefined, titleId: 'fallback-heading', titleFallback });

    const heading = screen.getByRole('heading', {
      level: 2,
      name: titleFallback,
    });
    // `sr-only` is the sole observable that distinguishes the visually-hidden
    // fallback heading from a normally rendered title.
    expect(heading).toHaveClass('sr-only');
    expect(heading).toHaveAttribute('id', 'fallback-heading');
  });

  it('falls back to titleFallback when title is an empty string', () => {
    const titleFallback = faker.lorem.sentence();

    setup({ title: '', titleId: 'fallback-heading', titleFallback });

    const heading = screen.getByRole('heading', {
      level: 2,
      name: titleFallback,
    });
    // `sr-only` is the sole observable that distinguishes the visually-hidden
    // fallback heading from a normally rendered title.
    expect(heading).toHaveClass('sr-only');
    expect(heading).toHaveAttribute('id', 'fallback-heading');
  });

  it('falls back to titleFallback when title is whitespace-only', () => {
    const titleFallback = faker.lorem.sentence();

    setup({ title: '   ', titleId: 'fallback-heading', titleFallback });

    const heading = screen.getByRole('heading', {
      level: 2,
      name: titleFallback,
    });
    expect(heading).toHaveClass('sr-only');
  });

  it('prefers title over titleFallback when both are provided', () => {
    const titleFallback = faker.lorem.sentence();

    setup({ titleFallback });

    const heading = screen.getByRole('heading', { level: 2, name: 'Latest' });
    expect(heading).not.toHaveClass('sr-only');
    expect(screen.queryByText(titleFallback)).not.toBeInTheDocument();
  });
});
