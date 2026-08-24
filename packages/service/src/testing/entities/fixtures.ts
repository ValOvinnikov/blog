import type { TRawFeedPost } from '@blog/service/features/entities/posts/adaptor/all-published.transformer';
import type { TRawTagWithPostCount } from '@blog/service/features/entities/tags/adaptor/transformer';
import type { TRawTopicWithPostCount } from '@blog/service/features/entities/topics/adaptor/transformer';
import type { TRawTag } from '@blog/service/shared/transformers/to-tag';
import type { TRawTopic } from '@blog/service/shared/transformers/to-topic';

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
    title: 'Hello World',
    slug: 'hello-world',
    excerpt: 'A sufficiently long excerpt for the card.',
    publishedAt: '2026-01-15T00:00:00Z',
    ...overrides,
  };
}
