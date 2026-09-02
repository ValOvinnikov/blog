import { makeRawPostCard } from '@blog/service/testing/pages/fixtures';
import { makeTenant } from '@blog/service/testing/tenant';

import {
  toRelatedPosts,
  type TRawRelatedByTags,
  type TRawRelatedByTopic,
} from './transformer';

function byTagsPost(
  overrides: Partial<Omit<TRawRelatedByTags[number], 'tagIds'>> & {
    tagIds?: { _id: string }[] | null;
  } = {},
): TRawRelatedByTags[number] {
  const { tagIds, ...postOverrides } = overrides;
  return {
    ...makeRawPostCard(postOverrides),
    tagIds: tagIds ?? [],
  };
}

function byTopicPost(
  overrides: Partial<TRawRelatedByTopic[number]> = {},
): TRawRelatedByTopic[number] {
  return makeRawPostCard(overrides);
}

const tenant = makeTenant();

describe(toRelatedPosts, () => {
  it('ranks candidates by shared-tag count desc, then publishedAt desc', () => {
    const oneShared = byTagsPost({
      _id: 'one-shared',
      publishedAt: '2026-01-01T00:00:00Z',
      tagIds: [{ _id: 'tag-a' }],
    });
    const twoShared = byTagsPost({
      _id: 'two-shared',
      publishedAt: '2026-01-01T00:00:00Z',
      tagIds: [{ _id: 'tag-a' }, { _id: 'tag-b' }],
    });
    const newerOneShared = byTagsPost({
      _id: 'newer-one-shared',
      publishedAt: '2026-02-01T00:00:00Z',
      tagIds: [{ _id: 'tag-a' }],
    });

    const result = toRelatedPosts(
      [oneShared, newerOneShared, twoShared],
      [],
      ['tag-a', 'tag-b'],
      tenant,
    );

    expect(result.map((post) => post.id)).toEqual([
      'two-shared',
      'newer-one-shared',
      'one-shared',
    ]);
  });

  it('returns at most 3 posts', () => {
    const byTags = Array.from({ length: 5 }, (_, i) =>
      byTagsPost({ _id: `post-${i}`, tagIds: [{ _id: 'tag-a' }] }),
    );

    const result = toRelatedPosts(byTags, [], ['tag-a'], tenant);

    expect(result).toHaveLength(3);
  });

  it('excludes the current post (the query already filters it, this asserts no re-inclusion by the transformer)', () => {
    const other = byTagsPost({ _id: 'other', tagIds: [{ _id: 'tag-a' }] });

    const result = toRelatedPosts([other], [], ['tag-a'], tenant);

    expect(result.map((post) => post.id)).not.toContain('current');
  });

  it('backfills remaining slots from the primary-topic pool when fewer than 3 share a tag', () => {
    const shared = byTagsPost({ _id: 'shared', tagIds: [{ _id: 'tag-a' }] });
    const topicOnlyA = byTopicPost({ _id: 'topic-a' });
    const topicOnlyB = byTopicPost({ _id: 'topic-b' });

    const result = toRelatedPosts(
      [shared],
      [topicOnlyA, topicOnlyB],
      ['tag-a'],
      tenant,
    );

    expect(result.map((post) => post.id)).toEqual([
      'shared',
      'topic-a',
      'topic-b',
    ]);
  });

  it('excludes posts from the topic backfill that were already tag-ranked', () => {
    const shared = byTagsPost({ _id: 'shared', tagIds: [{ _id: 'tag-a' }] });
    const duplicate = byTopicPost({ _id: 'shared' });
    const topicOnly = byTopicPost({ _id: 'topic-only' });

    const result = toRelatedPosts(
      [shared],
      [duplicate, topicOnly],
      ['tag-a'],
      tenant,
    );

    expect(result.map((post) => post.id)).toEqual(['shared', 'topic-only']);
  });

  it('fills entirely from the topic pool when the post has no tags', () => {
    const topicOnlyA = byTopicPost({ _id: 'topic-a' });
    const topicOnlyB = byTopicPost({ _id: 'topic-b' });

    const result = toRelatedPosts([], [topicOnlyA, topicOnlyB], [], tenant);

    expect(result.map((post) => post.id)).toEqual(['topic-a', 'topic-b']);
  });
});
