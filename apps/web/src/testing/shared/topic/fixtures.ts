import { LOCALE_ISO_CODES, CONTENT_ALIGNMENT } from '@blog/config';
import type {
  TTopic,
  TTopicDetailPage,
  TTopicWithPostCount,
} from '@blog/service';
import { createMockFaker } from '@web/testing/mock-faker';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { mockSeo } from '@web/testing/shared/seo/fixtures';

const mockFaker = createMockFaker(61058);

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

const [SECOND_TOPIC_TITLE, THIRD_TOPIC_TITLE] = mockFaker.helpers.uniqueArray(
  mockFaker.lorem.word,
  2,
);

const [SECOND_TOPIC_SLUG, THIRD_TOPIC_SLUG] = mockFaker.helpers.uniqueArray(
  mockFaker.lorem.slug,
  2,
);

export const MOCK_SECOND_TOPIC = mockTopicWithPostCount({
  id: mockFaker.string.uuid(),
  title: SECOND_TOPIC_TITLE!,
  slug: SECOND_TOPIC_SLUG!,
  description: undefined,
  postCount: 1,
});

export const MOCK_THIRD_TOPIC = mockTopicWithPostCount({
  id: mockFaker.string.uuid(),
  title: THIRD_TOPIC_TITLE!,
  slug: THIRD_TOPIC_SLUG!,
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
