import {
  makePostCard,
  makePostCardCategory,
} from '@web/testing/shared/post/fixtures';
import { getFormatter } from 'next-intl/server';

import { toPostListItems } from './to-post-list-items';

describe('toPostListItems', () => {
  it('maps a post card into the href/formattedDate shape PostsSection expects', async () => {
    const category = makePostCardCategory({ title: 'Engineering' });
    const post = makePostCard({
      id: 'post-1',
      slug: 'hello-world',
      title: 'Hello World',
      excerpt: 'An excerpt.',
      publishedAt: '2026-01-15T00:00:00.000Z',
      category,
    });

    const [item] = await toPostListItems([post]);

    expect(item).toEqual({
      id: 'post-1',
      href: '/blog/hello-world',
      title: 'Hello World',
      excerpt: 'An excerpt.',
      publishedAt: '2026-01-15T00:00:00.000Z',
      formattedDate: 'January 15, 2026',
      readingTime: undefined,
      category,
    });
  });

  it('formats the date via next-intl getFormatter, using the request-scoped locale', async () => {
    const post = makePostCard({ publishedAt: '2026-01-15T00:00:00.000Z' });

    vi.mocked(getFormatter).mockResolvedValueOnce({
      dateTime: () => '15 janvier 2026',
    } as unknown as Awaited<ReturnType<typeof getFormatter>>);

    const [item] = await toPostListItems([post]);

    expect(item?.formattedDate).toBe('15 janvier 2026');
  });

  it('calls dateTime with the published date and the year/month/day format', async () => {
    const post = makePostCard({ publishedAt: '2026-01-15T00:00:00.000Z' });
    const dateTimeMock = vi.fn().mockReturnValue('January 15, 2026');

    vi.mocked(getFormatter).mockResolvedValueOnce({
      dateTime: dateTimeMock,
    } as unknown as Awaited<ReturnType<typeof getFormatter>>);

    await toPostListItems([post]);

    expect(dateTimeMock).toHaveBeenCalledWith(new Date(post.publishedAt), {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  });

  it('derives readingTime from readingTimeMinutes when present (archive post cards)', async () => {
    const post = { ...makePostCard(), readingTimeMinutes: 5 };

    const [item] = await toPostListItems([post]);

    expect(item?.readingTime).toBe('5 min');
  });

  it('omits readingTime when the source has no readingTimeMinutes', async () => {
    const post = makePostCard();

    const [item] = await toPostListItems([post]);

    expect(item?.readingTime).toBeUndefined();
  });

  it('maps an empty list to an empty list', async () => {
    expect(await toPostListItems([])).toEqual([]);
  });
});
