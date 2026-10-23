import type {
  TFeedPost,
  TRawFeedPost,
} from '@blog/service/features/entities/posts/adaptor/all-published/transformer';
import type { toTags } from '@blog/service/features/entities/tags/adaptor/transformer';
import type { toTopics } from '@blog/service/features/entities/topics/adaptor/transformer';
import type { TRawTag } from '@blog/service/shared/transformers/tag/to-tag';
import type { TRawTopic } from '@blog/service/shared/transformers/topic/to-topic';
import {
  MOCK_POST_EXCERPT,
  MOCK_POST_PUBLISHED_AT,
  MOCK_POST_SLUG,
  MOCK_POST_TITLE,
  mockRawHeadingBlock,
} from '@blog/service/testing/shared/fixtures';

export const MOCK_DOCUMENT_ID = 'page_post-1';
export const MOCK_TAG_ID = 'tag-1';
export const MOCK_TAG_TITLE = 'TypeScript';
export const MOCK_TAG_SLUG = 'typescript';
export const MOCK_TOPIC_ID = 'topic-1';
export const MOCK_TOPIC_TITLE = 'Engineering';
export const MOCK_TOPIC_SLUG = 'engineering';
export const MOCK_TOPIC_DESCRIPTION = 'Engineering posts';

export const MOCK_FIRST_POST_TITLE = 'First';
export const MOCK_SECOND_POST_TITLE = 'Second';
export const MOCK_DESIGN_TERM = {
  _id: 'term-design',
  title: 'Product design',
  slug: 'product-design',
  postCount: 3,
};
export const MOCK_ENGINEERING_TERM = {
  _id: 'term-engineering',
  title: MOCK_TOPIC_TITLE,
  slug: MOCK_TOPIC_SLUG,
  postCount: 0,
};

type TRawTagWithPostCount = Parameters<typeof toTags>[0][number];
type TRawTopicWithPostCount = Parameters<typeof toTopics>[0][number];

export function mockRawTopic(overrides: Partial<TRawTopic> = {}): TRawTopic {
  return {
    _id: MOCK_TOPIC_ID,
    title: MOCK_TOPIC_TITLE,
    slug: MOCK_TOPIC_SLUG,
    description: MOCK_TOPIC_DESCRIPTION,
    ...overrides,
  };
}

export function mockRawTopicWithPostCount(
  overrides: Partial<TRawTopicWithPostCount> = {},
): TRawTopicWithPostCount {
  return {
    ...mockRawTopic(),
    postCount: 0,
    ...overrides,
  };
}

export function mockRawTag(overrides: Partial<TRawTag> = {}): TRawTag {
  return {
    _id: MOCK_TAG_ID,
    title: MOCK_TAG_TITLE,
    slug: MOCK_TAG_SLUG,
    ...overrides,
  };
}

export function mockRawTagWithPostCount(
  overrides: Partial<TRawTagWithPostCount> = {},
): TRawTagWithPostCount {
  return {
    ...mockRawTag(),
    description: 'TypeScript posts',
    postCount: 0,
    ...overrides,
  };
}

export function mockRawFeedPost(
  overrides: Partial<TRawFeedPost> = {},
): TRawFeedPost {
  return {
    headingBlock: mockRawHeadingBlock(MOCK_POST_TITLE, {
      supportingText: MOCK_POST_EXCERPT,
    }),
    slug: MOCK_POST_SLUG,
    publishedAt: MOCK_POST_PUBLISHED_AT,
    ...overrides,
  };
}

const FEED_POSTS = [
  { title: MOCK_FIRST_POST_TITLE, slug: 'first' },
  { title: MOCK_SECOND_POST_TITLE, slug: 'second' },
];

export function mockRawFeedPosts(): TRawFeedPost[] {
  return FEED_POSTS.map(({ title, slug }) =>
    mockRawFeedPost({
      headingBlock: mockRawHeadingBlock(title, {
        supportingText: MOCK_POST_EXCERPT,
      }),
      slug,
    }),
  );
}

export function mockFeedPostViews(): TFeedPost[] {
  return FEED_POSTS.map(({ title, slug }) => ({
    title,
    slug,
    excerpt: MOCK_POST_EXCERPT,
    publishedAt: MOCK_POST_PUBLISHED_AT,
  }));
}
