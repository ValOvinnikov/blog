import { makeRawPostCard } from '@blog/service/testing/pages/fixtures';

import {
  toRelatedPosts,
  type TRawRelatedByCategory,
  type TRawRelatedByTags,
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

function byCategoryPost(
  overrides: Partial<TRawRelatedByCategory[number]> = {},
): TRawRelatedByCategory[number] {
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

    const result = toRelatedPosts(byTags, [], ['tag-a']);

    expect(result).toHaveLength(3);
  });

  it('excludes the current post (the query already filters it, this asserts no re-inclusion by the transformer)', () => {
    const other = byTagsPost({ _id: 'other', tagIds: [{ _id: 'tag-a' }] });

    const result = toRelatedPosts([other], [], ['tag-a']);

    expect(result.map((post) => post.id)).not.toContain('current');
  });

  it('backfills remaining slots from the primary-category pool when fewer than 3 share a tag', () => {
    const shared = byTagsPost({ _id: 'shared', tagIds: [{ _id: 'tag-a' }] });
    const categoryOnlyA = byCategoryPost({ _id: 'category-a' });
    const categoryOnlyB = byCategoryPost({ _id: 'category-b' });

    const result = toRelatedPosts(
      [shared],
      [categoryOnlyA, categoryOnlyB],
      ['tag-a'],
    );

    expect(result.map((post) => post.id)).toEqual([
      'shared',
      'category-a',
      'category-b',
    ]);
  });

  it('excludes posts from the category backfill that were already tag-ranked', () => {
    const shared = byTagsPost({ _id: 'shared', tagIds: [{ _id: 'tag-a' }] });
    const duplicate = byCategoryPost({ _id: 'shared' });
    const categoryOnly = byCategoryPost({ _id: 'category-only' });

    const result = toRelatedPosts(
      [shared],
      [duplicate, categoryOnly],
      ['tag-a'],
    );

    expect(result.map((post) => post.id)).toEqual(['shared', 'category-only']);
  });

  it('fills entirely from the category pool when the post has no tags', () => {
    const categoryOnlyA = byCategoryPost({ _id: 'category-a' });
    const categoryOnlyB = byCategoryPost({ _id: 'category-b' });

    const result = toRelatedPosts([], [categoryOnlyA, categoryOnlyB], []);

    expect(result.map((post) => post.id)).toEqual(['category-a', 'category-b']);
  });
});
