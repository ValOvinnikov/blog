import { mockRawPostCard } from '@blog/service/testing/pages/fixtures';

import {
  toRelatedPosts,
  type TRawRelatedByTags,
  type TRawRelatedByTopic,
} from './transformer';

const TAG_A = 'tag-a';
const TAG_B = 'tag-b';
const PUBLISHED_AT = '2026-01-01T00:00:00Z';
const ONE_SHARED_ID = 'one-shared';
const TWO_SHARED_ID = 'two-shared';
const NEWER_ONE_SHARED_ID = 'newer-one-shared';
const TOPIC_ONLY_ID = 'topic-only';

function byTagsPost(
  overrides: Partial<Omit<TRawRelatedByTags[number], 'tagIds'>> & {
    tagIds?: { _id: string }[] | null;
  } = {},
): TRawRelatedByTags[number] {
  const { tagIds, ...postOverrides } = overrides;
  return {
    ...mockRawPostCard(postOverrides),
    tagIds: tagIds ?? [],
  };
}

function byTopicPost(
  overrides: Partial<TRawRelatedByTopic[number]> = {},
): TRawRelatedByTopic[number] {
  return mockRawPostCard(overrides);
}

describe(toRelatedPosts, () => {
  let shared: TRawRelatedByTags[number];
  let topicOnlyA: TRawRelatedByTopic[number];
  let topicOnlyB: TRawRelatedByTopic[number];

  beforeEach(() => {
    shared = byTagsPost({ _id: 'shared', tagIds: [{ _id: TAG_A }] });
    topicOnlyA = byTopicPost({ _id: 'topic-a' });
    topicOnlyB = byTopicPost({ _id: 'topic-b' });
  });

  it('ranks candidates by shared-tag count desc, then publishedAt desc', () => {
    const oneShared = byTagsPost({
      _id: ONE_SHARED_ID,
      publishedAt: PUBLISHED_AT,
      tagIds: [{ _id: TAG_A }],
    });
    const twoShared = byTagsPost({
      _id: TWO_SHARED_ID,
      publishedAt: PUBLISHED_AT,
      tagIds: [{ _id: TAG_A }, { _id: TAG_B }],
    });
    const newerOneShared = byTagsPost({
      _id: NEWER_ONE_SHARED_ID,
      publishedAt: '2026-02-01T00:00:00Z',
      tagIds: [{ _id: TAG_A }],
    });

    const result = toRelatedPosts(
      [oneShared, newerOneShared, twoShared],
      [],
      [TAG_A, TAG_B],
      3,
    );

    expect(result.map((post) => post.id)).toEqual([
      TWO_SHARED_ID,
      NEWER_ONE_SHARED_ID,
      ONE_SHARED_ID,
    ]);
  });

  it.each([
    [5, 3],
    [8, 6],
  ])('caps %i candidates at a limit of %i', (candidateCount, limit) => {
    const byTags = Array.from({ length: candidateCount }, (_, i) =>
      byTagsPost({ _id: `post-${i}`, tagIds: [{ _id: TAG_A }] }),
    );

    const result = toRelatedPosts(byTags, [], [TAG_A], limit);

    expect(result).toHaveLength(limit);
  });

  it('backfills from the primary-topic pool when too few share a tag', () => {
    const result = toRelatedPosts(
      [shared],
      [topicOnlyA, topicOnlyB],
      [TAG_A],
      3,
    );

    expect(result.map((post) => post.id)).toEqual([
      'shared',
      'topic-a',
      'topic-b',
    ]);
  });

  it('excludes posts from the topic backfill that were already tag-ranked', () => {
    const duplicate = byTopicPost({ _id: 'shared' });
    const topicOnly = byTopicPost({ _id: TOPIC_ONLY_ID });

    const result = toRelatedPosts([shared], [duplicate, topicOnly], [TAG_A], 3);

    expect(result.map((post) => post.id)).toEqual(['shared', TOPIC_ONLY_ID]);
  });

  it('fills entirely from the topic pool when the post has no tags', () => {
    const result = toRelatedPosts([], [topicOnlyA, topicOnlyB], [], 3);

    expect(result.map((post) => post.id)).toEqual(['topic-a', 'topic-b']);
  });

  it('returns an empty array when nothing qualifies', () => {
    const result = toRelatedPosts([], [], [], 3);

    expect(result).toEqual([]);
  });
});
