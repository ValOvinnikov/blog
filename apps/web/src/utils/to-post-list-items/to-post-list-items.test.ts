import type { TPostCard } from '@blog/service';
import {
  mockPostCard,
  mockPostCardTopic,
} from '@web/testing/shared/post/fixtures';
import { getFormatter } from 'next-intl/server';
import type { ReactNode } from 'react';

import { toPostListItems } from './to-post-list-items';

const POST_ID = 'post-1';
const POST_TITLE = 'Hello World';
const POST_EXCERPT = 'An excerpt.';
const FRENCH_DATE = '15 janvier 2026';
const PUBLISHED_AT = '2026-01-15T00:00:00.000Z';
const FORMATTED_DATE = 'January 15, 2026';

describe('toPostListItems', () => {
  it('maps a post card into the href/formattedDate shape MediaCardItem expects', async () => {
    const topic = mockPostCardTopic({ title: 'Engineering' });
    const post = mockPostCard({
      id: POST_ID,
      slug: 'hello-world',
      title: POST_TITLE,
      excerpt: POST_EXCERPT,
      publishedAt: PUBLISHED_AT,
      topic,
      readingTimeMinutes: 2,
    });

    const [item] = await toPostListItems([post]);

    expect(item).toEqual({
      id: POST_ID,
      href: '/blog/hello-world',
      title: POST_TITLE,
      excerpt: POST_EXCERPT,
      publishedAt: PUBLISHED_AT,
      formattedDate: FORMATTED_DATE,
      readingTime: '2 min',
      topic,
    });
  });

  describe('date formatting', () => {
    let post: TPostCard;

    beforeEach(() => {
      post = mockPostCard({ publishedAt: PUBLISHED_AT });
    });

    it('formats the date via next-intl getFormatter, using the request-scoped locale', async () => {
      vi.mocked(getFormatter).mockResolvedValueOnce({
        dateTime: () => FRENCH_DATE,
      } as unknown as Awaited<ReturnType<typeof getFormatter>>);

      const [item] = await toPostListItems([post]);

      expect(item?.formattedDate).toBe(FRENCH_DATE);
    });

    it('calls dateTime with the published date and the year/month/day format', async () => {
      const dateTimeMock = vi.fn().mockReturnValue(FORMATTED_DATE);

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
  });

  it('maps an empty list to an empty list', async () => {
    expect(await toPostListItems([])).toEqual([]);
  });

  it('maps a post card with no excerpt, without throwing', async () => {
    const post = mockPostCard({ excerpt: undefined });

    const [item] = await toPostListItems([post]);

    expect(item?.excerpt).toBeUndefined();
  });

  describe('image', () => {
    let post: TPostCard;

    beforeEach(() => {
      post = mockPostCard({ id: POST_ID });
    });

    it('sets image from renderImage when given', async () => {
      const image = 'rendered-image' as unknown as ReactNode;
      const renderImage = vi.fn().mockReturnValue(image);

      const [item] = await toPostListItems([post], renderImage);

      expect(renderImage).toHaveBeenCalledWith(post);
      expect(item?.image).toBe(image);
    });

    it('leaves image undefined when no renderImage is given', async () => {
      const [item] = await toPostListItems([post]);

      expect(item?.image).toBeUndefined();
    });
  });
});
