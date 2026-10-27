import { mockRawPostCard } from '@blog/service/testing/pages/fixtures';
import { faker } from '@faker-js/faker';

import {
  toRelatedPosts,
  type TRawRelatedByTags,
  type TRawRelatedByTopic,
} from './transformer';

faker.seed(14);

const MOCK_TAG_A_ID = faker.string.uuid();
const MOCK_TAG_B_ID = faker.string.uuid();
const MOCK_PUBLISHED_AT = faker.date.past().toISOString();
const MOCK_NEWER_PUBLISHED_AT = faker.date
  .soon({ refDate: MOCK_PUBLISHED_AT })
  .toISOString();
const MOCK_ONE_SHARED_ID = faker.string.uuid();
const MOCK_TWO_SHARED_ID = faker.string.uuid();
const MOCK_NEWER_ONE_SHARED_ID = faker.string.uuid();
const MOCK_SHARED_ID = faker.string.uuid();
const MOCK_TOPIC_A_ID = faker.string.uuid();
const MOCK_TOPIC_B_ID = faker.string.uuid();
const MOCK_TOPIC_ONLY_ID = faker.string.uuid();

function mockByTagsPost(
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

function mockByTopicPost(
  overrides: Partial<TRawRelatedByTopic[number]> = {},
): TRawRelatedByTopic[number] {
  return mockRawPostCard(overrides);
}

describe(toRelatedPosts, () => {
  let shared: TRawRelatedByTags[number];
  let topicOnlyA: TRawRelatedByTopic[number];
  let topicOnlyB: TRawRelatedByTopic[number];

  beforeEach(() => {
    shared = mockByTagsPost({
      _id: MOCK_SHARED_ID,
      tagIds: [{ _id: MOCK_TAG_A_ID }],
    });
    topicOnlyA = mockByTopicPost({ _id: MOCK_TOPIC_A_ID });
    topicOnlyB = mockByTopicPost({ _id: MOCK_TOPIC_B_ID });
  });

  it('ranks candidates by shared-tag count desc, then publishedAt desc', () => {
    const oneShared = mockByTagsPost({
      _id: MOCK_ONE_SHARED_ID,
      publishedAt: MOCK_PUBLISHED_AT,
      tagIds: [{ _id: MOCK_TAG_A_ID }],
    });
    const twoShared = mockByTagsPost({
      _id: MOCK_TWO_SHARED_ID,
      publishedAt: MOCK_PUBLISHED_AT,
      tagIds: [{ _id: MOCK_TAG_A_ID }, { _id: MOCK_TAG_B_ID }],
    });
    const newerOneShared = mockByTagsPost({
      _id: MOCK_NEWER_ONE_SHARED_ID,
      publishedAt: MOCK_NEWER_PUBLISHED_AT,
      tagIds: [{ _id: MOCK_TAG_A_ID }],
    });

    const result = toRelatedPosts(
      [oneShared, newerOneShared, twoShared],
      [],
      [MOCK_TAG_A_ID, MOCK_TAG_B_ID],
      3,
    );

    expect(result.map((post) => post.id)).toEqual([
      MOCK_TWO_SHARED_ID,
      MOCK_NEWER_ONE_SHARED_ID,
      MOCK_ONE_SHARED_ID,
    ]);
  });

  it.each([
    [5, 3],
    [8, 6],
  ])('caps %i candidates at a limit of %i', (candidateCount, limit) => {
    const byTags = Array.from({ length: candidateCount }, () =>
      mockByTagsPost({
        _id: faker.string.uuid(),
        tagIds: [{ _id: MOCK_TAG_A_ID }],
      }),
    );

    const result = toRelatedPosts(byTags, [], [MOCK_TAG_A_ID], limit);

    expect(result).toHaveLength(limit);
  });

  it('backfills from the primary-topic pool when too few share a tag', () => {
    const result = toRelatedPosts(
      [shared],
      [topicOnlyA, topicOnlyB],
      [MOCK_TAG_A_ID],
      3,
    );

    expect(result.map((post) => post.id)).toEqual([
      MOCK_SHARED_ID,
      MOCK_TOPIC_A_ID,
      MOCK_TOPIC_B_ID,
    ]);
  });

  it('excludes posts from the topic backfill that were already tag-ranked', () => {
    const duplicate = mockByTopicPost({ _id: MOCK_SHARED_ID });
    const topicOnly = mockByTopicPost({ _id: MOCK_TOPIC_ONLY_ID });

    const result = toRelatedPosts(
      [shared],
      [duplicate, topicOnly],
      [MOCK_TAG_A_ID],
      3,
    );

    expect(result.map((post) => post.id)).toEqual([
      MOCK_SHARED_ID,
      MOCK_TOPIC_ONLY_ID,
    ]);
  });

  it('fills entirely from the topic pool when the post has no tags', () => {
    const result = toRelatedPosts([], [topicOnlyA, topicOnlyB], [], 3);

    expect(result.map((post) => post.id)).toEqual([
      MOCK_TOPIC_A_ID,
      MOCK_TOPIC_B_ID,
    ]);
  });

  it('returns an empty array when nothing qualifies', () => {
    const result = toRelatedPosts([], [], [], 3);

    expect(result).toEqual([]);
  });
});
