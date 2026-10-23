import type { TPostCard, TPostCardTopic } from '@blog/service';
import { mockPostCardAuthor } from '@web/testing/shared/author/fixtures';

export const mockPostCardTopic = (
  overrides: Partial<TPostCardTopic> = {},
): TPostCardTopic => {
  return {
    id: 'topic-1',
    title: 'News',
    slug: 'news',
    ...overrides,
  };
};

export const mockPostCard = (overrides: Partial<TPostCard> = {}): TPostCard => {
  return {
    id: 'post-1',
    title: 'My Post Title',
    slug: 'my-post-slug',
    excerpt: 'An excerpt.',
    publishedAt: '2026-01-01T00:00:00.000Z',
    heroImage: undefined,
    featured: false,
    author: mockPostCardAuthor(),
    topic: mockPostCardTopic(),
    readingTimeMinutes: 2,
    ...overrides,
  };
};
