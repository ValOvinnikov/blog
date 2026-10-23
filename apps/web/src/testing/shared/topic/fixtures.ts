import { LOCALE_ISO_CODES, CONTENT_ALIGNMENT } from '@blog/config';
import type {
  TTopic,
  TTopicDetailPage,
  TTopicWithPostCount,
} from '@blog/service';
import { faker } from '@faker-js/faker';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { mockSeo } from '@web/testing/shared/seo/fixtures';

export const mockTopic = (overrides: Partial<TTopic> = {}): TTopic => {
  return {
    id: 'topic-1',
    title: 'Engineering',
    slug: 'engineering',
    description: 'Posts about building things.',
    ...overrides,
  };
};

export const mockTopicWithPostCount = (
  overrides: Partial<TTopicWithPostCount> = {},
): TTopicWithPostCount => {
  return {
    ...mockTopic(),
    postCount: 0,
    ...overrides,
  };
};

export const MOCK_ENGINEERING_TOPIC = mockTopicWithPostCount({
  description: undefined,
  postCount: 3,
});

export const MOCK_DESIGN_TOPIC = mockTopicWithPostCount({
  id: faker.string.uuid(),
  title: faker.lorem.word(),
  slug: faker.lorem.slug(),
  description: undefined,
  postCount: 1,
});

export const MOCK_PRODUCT_TOPIC = mockTopicWithPostCount({
  id: faker.string.uuid(),
  title: faker.lorem.word(),
  slug: faker.lorem.slug(),
  description: undefined,
  postCount: 2,
});

export const mockTopicDetailPage = (
  overrides: Partial<TTopicDetailPage> = {},
): TTopicDetailPage => {
  const topic = mockTopic();

  return {
    topic,
    headingAlignment: CONTENT_ALIGNMENT.LEFT,
    headingBlock: mockHeadingBlock({ heading: 'Engineering' }),
    hero: undefined,
    modules: [],
    faqs: [],
    seo: mockSeo({
      title: topic.title,
      description: topic.description,
      ogTitle: topic.title,
      ogDescription: topic.description,
    }),
    translations: [{ language: LOCALE_ISO_CODES.EN, slug: 'engineering' }],
    ...overrides,
  };
};
