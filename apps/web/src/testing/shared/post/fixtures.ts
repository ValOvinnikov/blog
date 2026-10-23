import type { TPostCard, TPostCardTopic } from '@blog/service';
import { mockPostCardAuthor } from '@web/testing/shared/author/fixtures';

export const MOCK_EN_POST_SLUG = 'localized-post';
export const MOCK_NL_POST_SLUG = 'vertaald-bericht';
export const MOCK_DE_POST_SLUG = 'uebersetzter-beitrag';

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
