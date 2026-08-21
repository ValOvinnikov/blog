import type { TTopic, TTopicWithPostCount } from '@blog/service';

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
