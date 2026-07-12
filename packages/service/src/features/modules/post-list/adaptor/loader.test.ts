import { describe, expect, it, vi } from 'vitest';

import { mockRun } from '#/testing/mock-run-query';
import { makeRawPostListModule } from '#/testing/modules/fixtures';
import { makeRawPostCard } from '#/testing/pages/fixtures';

import { getPostList } from './loader';

vi.mock('#/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('#/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe('getPostList', () => {
  it('maps the module doc and caps posts at its limit', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawPostListModule({ title: 'Recent writing', limit: 1 }),
      )
      .mockResolvedValueOnce([
        makeRawPostCard({ _id: 'a' }),
        makeRawPostCard({ _id: 'b' }),
      ]);

    const postList = await getPostList('post-list-1');

    expect(postList.title).toBe('Recent writing');
    expect(postList.posts.map((p) => p.id)).toEqual(['a']);
  });

  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(new Error('ValidationError'));

    await expect(getPostList('missing')).rejects.toThrow();
  });
});
