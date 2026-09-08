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

  it('renders each PostCard title at the caller-specified cardHeadingLevel', () => {
    setup({ cardHeadingLevel: 2 });

    for (const post of posts) {
      expect(
        screen.getByRole('heading', { level: 2, name: post.title }),
      ).toBeVisible();
    }
    expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument();
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

  it('renders no heading when title and accessibleTitle are both omitted', () => {
    setup({ title: undefined, titleId: undefined });

    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
  });

  it('still renders supportingText, the grid, and each post when title and accessibleTitle are both omitted', () => {
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

  it('renders the empty message without a heading when title and accessibleTitle are both omitted and posts is empty', () => {
    const emptyMessage = faker.lorem.sentence();

    setup({ title: undefined, titleId: undefined, posts: [], emptyMessage });

    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
    expect(screen.getByText(emptyMessage)).toBeVisible();
  });

  it('renders the grid without a heading when title and accessibleTitle are both omitted and isTinted', () => {
    setup({ title: undefined, titleId: undefined, isTinted: true });

    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
    for (const post of posts) {
      expect(
        screen.getByRole('heading', { level: 3, name: post.title }),
      ).toBeVisible();
    }
  });

  it('renders a visually-hidden heading from accessibleTitle when title is omitted', () => {
    const accessibleTitle = faker.lorem.sentence();

    setup({ title: undefined, titleId: 'fallback-heading', accessibleTitle });

    const heading = screen.getByRole('heading', {
      level: 2,
      name: accessibleTitle,
    });
    // `sr-only` is the sole observable that distinguishes the visually-hidden
    // fallback heading from a normally rendered title.
    expect(heading).toHaveClass('sr-only');
    expect(heading).toHaveAttribute('id', 'fallback-heading');
  });

  it('falls back to accessibleTitle when title is an empty string', () => {
    const accessibleTitle = faker.lorem.sentence();

    setup({ title: '', titleId: 'fallback-heading', accessibleTitle });

    const heading = screen.getByRole('heading', {
      level: 2,
      name: accessibleTitle,
    });
    // `sr-only` is the sole observable that distinguishes the visually-hidden
    // fallback heading from a normally rendered title.
    expect(heading).toHaveClass('sr-only');
    expect(heading).toHaveAttribute('id', 'fallback-heading');
  });

  it('falls back to accessibleTitle when title is whitespace-only', () => {
    const accessibleTitle = faker.lorem.sentence();

    setup({ title: '   ', titleId: 'fallback-heading', accessibleTitle });

    const heading = screen.getByRole('heading', {
      level: 2,
      name: accessibleTitle,
    });
    expect(heading).toHaveClass('sr-only');
  });

  it('prefers title over accessibleTitle when both are provided', () => {
    const accessibleTitle = faker.lorem.sentence();

    setup({ accessibleTitle });

    const heading = screen.getByRole('heading', { level: 2, name: 'Latest' });
    expect(heading).not.toHaveClass('sr-only');
    expect(screen.queryByText(accessibleTitle)).not.toBeInTheDocument();
  });

  it('renders no media region on any card when hasImages is unset', () => {
    setup();

    expect(screen.queryAllByTestId('post-card-media')).toHaveLength(0);
  });

  it('renders a PostCard.Media region on every card when hasImages is set, including cards with no image node', () => {
    const postsWithMixedImages = posts.map((post, index) =>
      index === 0
        ? { ...post, image: <img src="/cover.jpg" alt={post.title} /> }
        : post,
    );

    setup({ posts: postsWithMixedImages, hasImages: true });

    expect(screen.getAllByTestId('post-card-media')).toHaveLength(posts.length);
    expect(screen.getByRole('img', { name: posts[0]?.title })).toBeVisible();
  });

  it('keeps the grid holding one PostCard per post with mixed image presence', () => {
    const postsWithMixedImages = posts.map((post, index) =>
      index === 1
        ? { ...post, image: <img src="/cover.jpg" alt={post.title} /> }
        : post,
    );

    setup({ posts: postsWithMixedImages, hasImages: true });

    for (const post of posts) {
      expect(
        screen.getByRole('heading', { level: 3, name: post.title }),
      ).toBeVisible();
    }
    expect(screen.getAllByTestId('post-card-media')).toHaveLength(posts.length);
  });

  describe('hasLead', () => {
    it('renders the first post as a lead card carrying both isSplit and isLead when hasImages is set', () => {
      setup({ hasLead: true, hasImages: true });

      const leadCard = screen.getByTestId('posts-section-lead');
      expect(leadCard).toHaveClass('md:flex-row');
      const firstPost = posts[0];
      if (!firstPost?.excerpt) throw new Error('expected first post excerpt');
      expect(screen.getByText(firstPost.excerpt)).toHaveClass('line-clamp-3');
    });

    it('renders the lead card at full width, not split, when hasImages is unset', () => {
      setup({ hasLead: true });

      const leadCard = screen.getByTestId('posts-section-lead');
      expect(leadCard).not.toHaveClass('md:flex-row');
      const firstPost = posts[0];
      if (!firstPost?.excerpt) throw new Error('expected first post excerpt');
      expect(screen.getByText(firstPost.excerpt)).toHaveClass('line-clamp-3');
    });

    it('applies cardHeadingLevel to the lead card too', () => {
      setup({ hasLead: true, cardHeadingLevel: 2 });

      const leadCard = screen.getByTestId('posts-section-lead');
      const firstPost = posts[0];
      if (!firstPost) throw new Error('expected first post');
      expect(
        screen.getByRole('heading', { level: 2, name: firstPost.title }),
      ).toBeVisible();
      expect(leadCard).toBeVisible();
    });

    it('renders a single remaining post as a full-width split card, not a grid, when hasImages is set', () => {
      setup({ hasLead: true, hasImages: true, posts: posts.slice(0, 2) });

      const tailCard = screen.getByTestId('posts-section-tail');
      expect(tailCard).toHaveClass('md:flex-row');
      expect(
        screen.queryByTestId('posts-section-tail-grid'),
      ).not.toBeInTheDocument();
    });

    it('renders a single remaining post at full width, not split, when hasImages is unset', () => {
      setup({ hasLead: true, posts: posts.slice(0, 2) });

      const tailCard = screen.getByTestId('posts-section-tail');
      expect(tailCard).not.toHaveClass('md:flex-row');
      expect(
        screen.queryByTestId('posts-section-tail-grid'),
      ).not.toBeInTheDocument();
    });

    it('renders two remaining posts in a two-column tail row that never widens to three columns', () => {
      setup({ hasLead: true, posts: posts.slice(0, 3) });

      const tailGrid = screen.getByTestId('posts-section-tail-grid');
      expect(tailGrid).toHaveClass('sm:grid-cols-2');
      expect(tailGrid).not.toHaveClass('md:grid-cols-3');
      expect(
        screen.queryByTestId('posts-section-tail'),
      ).not.toBeInTheDocument();
    });

    it('renders only the lead card, with no tail, for a single post', () => {
      setup({ hasLead: true, posts: posts.slice(0, 1) });

      expect(screen.getByTestId('posts-section-lead')).toBeVisible();
      expect(
        screen.queryByTestId('posts-section-tail'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('posts-section-tail-grid'),
      ).not.toBeInTheDocument();
    });

    it('behaves exactly as before when hasLead is unset', () => {
      setup();

      expect(
        screen.queryByTestId('posts-section-lead'),
      ).not.toBeInTheDocument();
      for (const post of posts) {
        expect(
          screen.getByRole('heading', { level: 3, name: post.title }),
        ).toBeVisible();
      }
    });
  });
});
