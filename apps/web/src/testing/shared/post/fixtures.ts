import type { TPostCard, TPostCardCategory } from '@blog/service';
import { makePostCardAuthor } from '@web/testing/shared/author/fixtures';

export function makePostCardCategory(
  overrides: Partial<TPostCardCategory> = {},
): TPostCardCategory {
  return {
    id: 'cat-1',
    title: 'News',
    slug: 'news',
    ...overrides,
  };
}

export function makePostCard(overrides: Partial<TPostCard> = {}): TPostCard {
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
    category: makePostCardCategory(),
    readingTimeMinutes: 2,
    ...overrides,
  };
}
