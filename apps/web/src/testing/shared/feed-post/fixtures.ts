import type { TFeedPost } from '@blog/service';
import { faker } from '@faker-js/faker';

export const MOCK_FEED_POST_SLUG = faker.lorem.slug();

export const mockFeedPost = (overrides: Partial<TFeedPost> = {}): TFeedPost => {
  return {
    title: faker.lorem.sentence(),
    slug: MOCK_FEED_POST_SLUG,
    excerpt: faker.lorem.sentence(),
    publishedAt: faker.date.past().toISOString(),
    ...overrides,
  };
};
