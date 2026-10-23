import { LOCALE_ISO_CODES, CONTENT_ALIGNMENT } from '@blog/config';
import type {
  TTopic,
  TTopicDetailPage,
  TTopicWithPostCount,
} from '@blog/service';
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
