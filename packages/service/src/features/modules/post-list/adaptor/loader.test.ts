import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawPostListModule } from '@blog/service/testing/modules/fixtures';
import { makeRawPostCard } from '@blog/service/testing/pages/fixtures';

import { getPostList } from './loader';
import * as postsQuery from './posts.query';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe('getPostList', () => {
  it('bounds the posts query by the module limit and maps the result', async () => {
    const querySpy = vi.spyOn(postsQuery, 'postListModulePostsQuery');
    mockRun
      .mockResolvedValueOnce(
        makeRawPostListModule({ title: 'Recent writing', limit: 3 }),
      )
      .mockResolvedValueOnce([makeRawPostCard({ _id: 'a' })]);

    const postList = await getPostList('post-list-1');

    // The module's `limit` is threaded into the GROQ posts query.
    expect(querySpy).toHaveBeenCalledWith(3);
    expect(postList.title).toBe('Recent writing');
    expect(postList.posts.map((p) => p.id)).toEqual(['a']);
  });

  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(new Error('ValidationError'));

    await expect(getPostList('missing')).rejects.toThrow();
  });
});
