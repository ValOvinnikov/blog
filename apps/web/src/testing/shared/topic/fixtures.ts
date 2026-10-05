import type {
  TTopic,
  TTopicDetailPage,
  TTopicWithPostCount,
} from '@blog/service';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

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
  return {
    topic: makeTopic(),
    headingBlock: makeHeadingBlock({ heading: 'Engineering' }),
    hero: undefined,
    modules: [],
    faqs: [],
    seo: {
      title: 'Engineering',
      description: 'Posts about building things.',
      ogTitle: 'Engineering',
      ogDescription: 'Posts about building things.',
      ogImage: undefined,
    },
    ...overrides,
  };
};
