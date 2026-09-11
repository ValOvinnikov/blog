import { toPostCard } from '@blog/service/shared/transformers/to-post-card';
import { makeRawPostRelatedModule } from '@blog/service/testing/modules/fixtures';
import { makeRawPostCard } from '@blog/service/testing/pages/fixtures';

import {
  toPostRelatedModule,
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
      3,
    );

    expect(result.map((post) => post.id)).toEqual([
      'two-shared',
      'newer-one-shared',
      'one-shared',
    ]);
  });

  it('caps the result at the given limit', () => {
    const byTags = Array.from({ length: 5 }, (_, i) =>
      byTagsPost({ _id: `post-${i}`, tagIds: [{ _id: 'tag-a' }] }),
    );

    const result = toRelatedPosts(byTags, [], ['tag-a'], 3);

    expect(result).toHaveLength(3);
  });

  it('allows a larger limit, up to the schema max', () => {
    const byTags = Array.from({ length: 8 }, (_, i) =>
      byTagsPost({ _id: `post-${i}`, tagIds: [{ _id: 'tag-a' }] }),
    );

    const result = toRelatedPosts(byTags, [], ['tag-a'], 6);

    expect(result).toHaveLength(6);
  });

  it('excludes the current post (the query already filters it, this asserts no re-inclusion by the transformer)', () => {
    const other = byTagsPost({ _id: 'other', tagIds: [{ _id: 'tag-a' }] });

    const result = toRelatedPosts([other], [], ['tag-a'], 3);

    expect(result.map((post) => post.id)).not.toContain('current');
  });

  it('backfills remaining slots from the primary-topic pool when fewer than the limit share a tag', () => {
    const shared = byTagsPost({ _id: 'shared', tagIds: [{ _id: 'tag-a' }] });
    const topicOnlyA = byTopicPost({ _id: 'topic-a' });
    const topicOnlyB = byTopicPost({ _id: 'topic-b' });

    const result = toRelatedPosts(
      [shared],
      [topicOnlyA, topicOnlyB],
      ['tag-a'],
      3,
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
      3,
    );

    expect(result.map((post) => post.id)).toEqual(['shared', 'topic-only']);
  });

  it('fills entirely from the topic pool when the post has no tags', () => {
    const topicOnlyA = byTopicPost({ _id: 'topic-a' });
    const topicOnlyB = byTopicPost({ _id: 'topic-b' });

    const result = toRelatedPosts([], [topicOnlyA, topicOnlyB], [], 3);

    expect(result.map((post) => post.id)).toEqual(['topic-a', 'topic-b']);
  });

  it('returns an empty array when nothing qualifies', () => {
    const result = toRelatedPosts([], [], [], 3);

    expect(result).toEqual([]);
  });
});

describe(toPostRelatedModule, () => {
  it('maps the module fields alongside the given posts', () => {
    const posts = [toPostCard(makeRawPostCard({ _id: 'related-1' }))];

    const result = toPostRelatedModule(makeRawPostRelatedModule(), posts);

    expect(result.posts).toBe(posts);
    expect(result.brandVariant).toBe('PRIMARY');
    expect(result.showImages).toBe(true);
  });

  it('falls back to an undefined heading and supporting text when headingBlock is absent', () => {
    const result = toPostRelatedModule(
      makeRawPostRelatedModule({ headingBlock: null }),
      [],
    );

    expect(result.headingBlock).toEqual({
      heading: undefined,
      supportingText: undefined,
    });
  });
});
