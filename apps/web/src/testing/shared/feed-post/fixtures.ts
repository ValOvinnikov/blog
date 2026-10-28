import type { TFeedPost } from '@blog/service';
import { faker } from '@faker-js/faker';
import { createMockFaker } from '@web/testing/mock-faker';

const mockFaker = createMockFaker(61055);

export const MOCK_FEED_POST_SLUG = mockFaker.lorem.slug();

export const mockFeedPost = (overrides: Partial<TFeedPost> = {}): TFeedPost => {
  return {
    title: faker.lorem.sentence(),
    slug: MOCK_FEED_POST_SLUG,
    excerpt: faker.lorem.sentence(),
    publishedAt: faker.date.past().toISOString(),
    ...overrides,
  };
};
