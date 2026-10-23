import { LOCALE_ISO_CODES, CONTENT_ALIGNMENT } from '@blog/config';
import type {
  TTopic,
  TTopicDetailPage,
  TTopicWithPostCount,
} from '@blog/service';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { mockSeo } from '@web/testing/shared/seo/fixtures';

export const makeTopic = (overrides: Partial<TTopic> = {}): TTopic => {
  return {
    id: 'topic-1',
    title: 'Engineering',
    slug: 'engineering',
    description: 'Posts about building things.',
    ...overrides,
  };
};

export const makeTopicWithPostCount = (
  overrides: Partial<TTopicWithPostCount> = {},
): TTopicWithPostCount => {
  return {
    ...makeTopic(),
    postCount: 0,
    ...overrides,
  };
};

export const makeTopicDetailPage = (
  overrides: Partial<TTopicDetailPage> = {},
): TTopicDetailPage => {
  const topic = makeTopic();

  return {
    topic,
    headingAlignment: CONTENT_ALIGNMENT.LEFT,
    headingBlock: makeHeadingBlock({ heading: 'Engineering' }),
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
