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
  categories: [{ title: faker.lorem.word() }],
});

const posts = faker.helpers.multiple(makePost, { count: 3 });

const setup = customRender(PostsSection, {
  title: 'Latest',
  titleId: 'latest-posts',
  posts,
});

describe(`<${PostsSection.name}/>`, () => {
  it('labels the section with its title', () => {
    setup();

    expect(screen.getByRole('region', { name: 'Latest' })).toBeVisible();
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

  it('returns null when posts is empty', () => {
    const { container } = setup({ posts: [] });

    expect(container).toBeEmptyDOMElement();
  });

  it('forwards data-testid', () => {
    setup({ dataTestId: 'latest-posts-section' });

    expect(screen.getByTestId('latest-posts-section')).toBeVisible();
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
});
