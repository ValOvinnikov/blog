import type { TRawFeedPost } from '@blog/service/features/entities/posts/adaptor/all-published/transformer';
import type { toTags } from '@blog/service/features/entities/tags/adaptor/transformer';
import type { toTopics } from '@blog/service/features/entities/topics/adaptor/transformer';
import type { TRawTag } from '@blog/service/shared/transformers/tag/to-tag';
import type { TRawTopic } from '@blog/service/shared/transformers/topic/to-topic';
import { makeRawHeadingBlock } from '@blog/service/testing/shared/fixtures';

type TRawTagWithPostCount = Parameters<typeof toTags>[0][number];
type TRawTopicWithPostCount = Parameters<typeof toTopics>[0][number];

export function makeRawTopic(overrides: Partial<TRawTopic> = {}): TRawTopic {
  return {
    _id: 'topic-1',
    title: 'Engineering',
    slug: 'engineering',
    description: 'Engineering posts',
    ...overrides,
  };
}

export function makeRawTopicWithPostCount(
  overrides: Partial<TRawTopicWithPostCount> = {},
): TRawTopicWithPostCount {
  return {
    ...makeRawTopic(),
    postCount: 0,
    ...overrides,
  };
}

export function makeRawTag(overrides: Partial<TRawTag> = {}): TRawTag {
  return {
    _id: 'tag-1',
    title: 'TypeScript',
    slug: 'typescript',
    ...overrides,
  };
}

export function makeRawTagWithPostCount(
  overrides: Partial<TRawTagWithPostCount> = {},
): TRawTagWithPostCount {
  return {
    ...makeRawTag(),
    description: 'TypeScript posts',
    postCount: 0,
    ...overrides,
  };
}

export function makeRawFeedPost(
  overrides: Partial<TRawFeedPost> = {},
): TRawFeedPost {
  return {
    headingBlock: makeRawHeadingBlock('Hello World', {
      supportingText: 'A sufficiently long excerpt for the card.',
    }),
    slug: 'hello-world',
    publishedAt: '2026-01-15T00:00:00Z',
    ...overrides,
  };
}
