import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawPostListModule } from '@blog/service/testing/modules/fixtures';
import { makeRawPostCard } from '@blog/service/testing/pages/fixtures';

import { getPostList } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe('getPostList', () => {
  it('bounds the posts query by the module pageSize and maps the result', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawPostListModule({
          sectionHeader: {
            heading: 'Recent writing',
            supportingText: null,
            align: null,
          },
          pageSize: 3,
        }),
      )
      .mockResolvedValueOnce({
        posts: [makeRawPostCard({ _id: 'a' })],
        total: 1,
      });

    const postList = await getPostList('post-list-1');

    // The module's `pageSize` is threaded into the GROQ posts query's slice bound.
    expect(mockRun.mock.calls[1]?.[0]?.query).toContain('[0...3]');
    expect(postList.sectionHeader.heading).toBe('Recent writing');
    expect(postList.posts.map((p) => p.id)).toEqual(['a']);
  });

  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(new Error('ValidationError'));

    await expect(getPostList('missing')).rejects.toThrow();
  });

  it('tags the posts query with author/topic alongside posts', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawPostListModule({ pageSize: 3 }))
      .mockResolvedValueOnce({
        posts: [makeRawPostCard({ _id: 'a' })],
        total: 1,
      });

    await getPostList('post-list-1');

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

  it('defaults to page 1', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawPostListModule({ pageSize: 9 }))
      .mockResolvedValueOnce({
        posts: [makeRawPostCard({ _id: 'a' })],
        total: 20,
      });

    await getPostList('post-list-1');

    expect(mockRun.mock.calls[1]?.[0]?.query).toContain('[0...9]');
  });

  it('windows by an explicit page number and returns the total', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawPostListModule({ pageSize: 9 }))
      .mockResolvedValueOnce({
        posts: [makeRawPostCard({ _id: 'a' })],
        total: 25,
      });

    const postList = await getPostList('post-list-1', 2);

    expect(mockRun.mock.calls[1]?.[0]?.query).toContain('[9...18]');
    expect(postList.posts.map((p) => p.id)).toEqual(['a']);
    expect(postList.total).toBe(25);
  });
});
