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
  category: { title: faker.lorem.word() },
});

const posts = faker.helpers.multiple(makePost, { count: 3 });
const [firstPost] = posts;
if (!firstPost) {
  throw new Error('expected `makePost` to produce at least one post');
}

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

  it('renders each post category lowercased in the footer', () => {
    setup();

    for (const post of posts) {
      expect(
        screen.getByText(post.category.title.toLowerCase(), {
          exact: false,
        }),
      ).toBeVisible();
    }
  });

  it('renders a trailing arrow icon in each post category footer', () => {
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

  it('nests the heading and the grid inside a shared wrapper when tinted', () => {
    setup({ tinted: true });

    const heading = screen.getByRole('heading', { level: 2, name: 'Latest' });
    const contentGroup = heading.parentElement;
    expect(contentGroup).toContainElement(
      screen.getByRole('heading', { level: 3, name: firstPost.title }),
    );
  });

  it('does not wrap the heading in an extra wrapper when not tinted', () => {
    const { container } = setup();

    const heading = screen.getByRole('heading', { level: 2, name: 'Latest' });
    expect(heading.parentElement).toBe(container.firstElementChild);
  });

  it('wraps the heading and grid in two extra levels of wrapper when tinted, unlike the flat structure when not', () => {
    const { container } = setup({ tinted: true });

    const heading = screen.getByRole('heading', { level: 2, name: 'Latest' });
    const contentGroup = heading.parentElement;
    const inner = contentGroup?.parentElement;
    const root = container.firstElementChild;
    expect(contentGroup).not.toBe(inner);
    expect(inner?.parentElement).toBe(root);
  });

  it('keeps the h2 heading markup unchanged when tinted', () => {
    setup({ tinted: true });

    expect(
      screen.getByRole('heading', { level: 2, name: 'Latest' }),
    ).toBeVisible();
  });
});
