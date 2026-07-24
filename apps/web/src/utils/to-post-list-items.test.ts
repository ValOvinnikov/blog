import {
  makePostCard,
  makePostCardCategory,
} from '@web/testing/shared/post/fixtures';

import { toPostListItems } from './to-post-list-items';

describe('toPostListItems', () => {
  it('maps a post card into the href/formattedDate shape PostsSection expects', () => {
    const category = makePostCardCategory({ title: 'Engineering' });
    const post = makePostCard({
      id: 'post-1',
      slug: 'hello-world',
      title: 'Hello World',
      excerpt: 'An excerpt.',
      publishedAt: '2026-01-15T00:00:00.000Z',
      categories: [category],
    });

    const [item] = toPostListItems([post], 'en');

    expect(item).toEqual({
      id: 'post-1',
      href: '/blog/hello-world',
      title: 'Hello World',
      excerpt: 'An excerpt.',
      publishedAt: '2026-01-15T00:00:00.000Z',
      formattedDate: 'January 15, 2026',
      readingTime: undefined,
      categories: [category],
    });
  });

  it('formats the date using the given locale', () => {
    const post = makePostCard({ publishedAt: '2026-01-15T00:00:00.000Z' });

    const [item] = toPostListItems([post], 'fr');

    expect(item?.formattedDate).toBe('15 janvier 2026');
  });

  it('derives readingTime from readingTimeMinutes when present (archive post cards)', () => {
    const post = { ...makePostCard(), readingTimeMinutes: 5 };

    const [item] = toPostListItems([post], 'en');

    expect(item?.readingTime).toBe('5 min');
  });

  it('omits readingTime when the source has no readingTimeMinutes', () => {
    const post = makePostCard();

    const [item] = toPostListItems([post], 'en');

    expect(item?.readingTime).toBeUndefined();
  });

  it('maps an empty list to an empty list', () => {
    expect(toPostListItems([], 'en')).toEqual([]);
  });
});
