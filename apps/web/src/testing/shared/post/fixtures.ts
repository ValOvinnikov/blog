import type { TPostCard, TPostCardTopic } from '@blog/service';
import { makePostCardAuthor } from '@web/testing/shared/author/fixtures';

export const makePostCardTopic = (
  overrides: Partial<TPostCardTopic> = {},
): TPostCardTopic => {
  return {
    id: 'topic-1',
    title: 'News',
    slug: 'news',
    ...overrides,
  };
};

export const makePostCard = (overrides: Partial<TPostCard> = {}): TPostCard => {
  return {
    id: 'post-1',
    title: 'My Post Title',
    slug: 'my-post-slug',
    excerpt: 'An excerpt.',
    publishedAt: '2026-01-01T00:00:00.000Z',
    heroImageUrl: undefined,
    heroImageAlt: undefined,
    heroImageSanity: undefined,
    featured: false,
    author: makePostCardAuthor(),
    topic: makePostCardTopic(),
    readingTimeMinutes: 2,
    ...overrides,
  };
};
