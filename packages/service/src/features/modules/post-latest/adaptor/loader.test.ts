import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawPostLatestModule } from '@blog/service/testing/modules/fixtures';
import { makeRawPostCard } from '@blog/service/testing/pages/fixtures';

import { getPostLatest } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe('getPostLatest', () => {
  it('bounds the posts query by the module limit and maps the result', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawPostLatestModule({
          sectionHeader: {
            heading: 'Recent writing',
            supportingText: null,
            align: null,
          },
          limit: 3,
        }),
      )
      .mockResolvedValueOnce([makeRawPostCard({ _id: 'a' })]);

    const postLatest = await getPostLatest('post-latest-1');

    // The module's `limit` is threaded into the GROQ posts query's slice bound.
    expect(mockRun.mock.calls[1]?.[0]?.query).toContain('[0...3]');
    expect(postLatest.sectionHeader.heading).toBe('Recent writing');
    expect(postLatest.posts.map((p) => p.id)).toEqual(['a']);
  });

  it('returns an empty list when no posts resolve', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawPostLatestModule({ limit: 3 }))
      .mockResolvedValueOnce([]);

    const postLatest = await getPostLatest('post-latest-1');

    expect(postLatest.posts).toEqual([]);
  });

  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(new Error('ValidationError'));

    await expect(getPostLatest('missing')).rejects.toThrow();
  });

  it('tags the module query with the module id', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawPostLatestModule({ limit: 3 }))
      .mockResolvedValueOnce([makeRawPostCard({ _id: 'a' })]);

    await getPostLatest('post-latest-1');

    expect(mockRun).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      expect.objectContaining({
        next: expect.objectContaining({
          tags: ['modules:postLatest', 'module:post-latest-1'],
        }),
      }),
    );
  });

  it('tags the posts query with author/topic alongside posts', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawPostLatestModule({ limit: 3 }))
      .mockResolvedValueOnce([makeRawPostCard({ _id: 'a' })]);

    await getPostLatest('post-latest-1');

    expect(mockRun).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      expect.objectContaining({
        next: expect.objectContaining({
          tags: ['posts', 'author', 'topic'],
        }),
      }),
    );
  });
});
