import type { TRawTopicWithPostCount } from '@blog/service/features/entities/topics/adaptor/transformer';
import type { TRawAuthor } from '@blog/service/features/pages/author/adaptor/detail-page/transformer';
import type { TRawTag } from '@blog/service/shared/transformers/to-tag';
import type { TRawTopic } from '@blog/service/shared/transformers/to-topic';
import { makeRawImage } from '@blog/service/testing/shared/fixtures';

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

export function makeRawAuthor(overrides: Partial<TRawAuthor> = {}): TRawAuthor {
  return {
    _id: 'author-1',
    name: 'Jane Doe',
    slug: 'jane-doe',
    image: makeRawImage('Jane avatar'),
    role: 'Writer',
    bio: null,
    socialLinks: null,
    ...overrides,
  };
}
