import { describe, expect, it } from 'vitest';

import { makeRawPostListModule } from '#/testing/modules/fixtures';
import { makeRawPostCard } from '#/testing/pages/fixtures';

import { toPostListModule } from './transformer';

describe('toPostListModule', () => {
  it('caps posts at the configured limit', () => {
    const raw = makeRawPostListModule({ title: 'Recent writing', limit: 1 });
    const rawPosts = [
      makeRawPostCard({ _id: 'a' }),
      makeRawPostCard({ _id: 'b' }),
    ];

    const module = toPostListModule(raw, rawPosts);

    expect(module.title).toBe('Recent writing');
    expect(module.posts.map((p) => p.id)).toEqual(['a']);
  });

  it('returns all posts when fewer than the limit', () => {
    const raw = makeRawPostListModule({ limit: 6 });
    const rawPosts = [makeRawPostCard({ _id: 'a' })];

    const module = toPostListModule(raw, rawPosts);

    expect(module.posts).toHaveLength(1);
  });
});
