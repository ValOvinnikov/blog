import { routes } from '@blog/config';
import type { TPostCard } from '@blog/service';
import { faker } from '@faker-js/faker';
import {
  mockPostCard,
  mockPostCardTopic,
} from '@web/testing/shared/post/fixtures';
import { getFormatter } from 'next-intl/server';
import type { ReactNode } from 'react';

import { toPostListItems } from './to-post-list-items';

faker.seed(6012);

const MOCK_PUBLISHED_AT = '2026-01-15T00:00:00.000Z';
const MOCK_FORMATTED_DATE = 'January 15, 2026';
const MOCK_TRANSLATED_DATE = faker.date.weekday();
const MOCK_READING_TIME_MINUTES = faker.number.int({ min: 2, max: 9 });
const MOCK_IMAGE = faker.lorem.word() as unknown as ReactNode;

describe(toPostListItems, () => {
  it('maps a post card into the card item shape', async () => {
    const topic = mockPostCardTopic();
    const post = mockPostCard({
      publishedAt: MOCK_PUBLISHED_AT,
      topic,
      readingTimeMinutes: MOCK_READING_TIME_MINUTES,
    });
    const { id, slug, title, excerpt } = post;

    const [item] = await toPostListItems([post]);

    expect(item).toEqual({
      id,
      href: routes.post(slug),
      title,
      excerpt,
      publishedAt: MOCK_PUBLISHED_AT,
      formattedDate: MOCK_FORMATTED_DATE,
      readingTime: `${MOCK_READING_TIME_MINUTES} min`,
      topic,
    });
  });

  it('formats the date with the request-scoped formatter', async () => {
    vi.mocked(getFormatter).mockResolvedValueOnce({
      dateTime: () => MOCK_TRANSLATED_DATE,
    } as unknown as Awaited<ReturnType<typeof getFormatter>>);
    const post = mockPostCard({ publishedAt: MOCK_PUBLISHED_AT });

    const [item] = await toPostListItems([post]);

    expect(item?.formattedDate).toBe(MOCK_TRANSLATED_DATE);
  });

  it('maps an empty list to an empty list', async () => {
    expect(await toPostListItems([])).toEqual([]);
  });

  it('maps a post card with no excerpt', async () => {
    const post = mockPostCard({ excerpt: undefined });

    const [item] = await toPostListItems([post]);

    expect(item?.excerpt).toBeUndefined();
  });

  describe('image', () => {
    let post: TPostCard;

    beforeEach(() => {
      post = mockPostCard();
    });

    it('takes the image from the render callback when given', async () => {
      const renderImage = vi.fn().mockReturnValue(MOCK_IMAGE);

      const [item] = await toPostListItems([post], renderImage);

      expect(renderImage).toHaveBeenCalledWith(post);
      expect(item?.image).toBe(MOCK_IMAGE);
    });

    it('leaves the image undefined without a render callback', async () => {
      const [item] = await toPostListItems([post]);

      expect(item?.image).toBeUndefined();
    });
  });
});
