import { TAXONOMY_KIND } from '@blog/config';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawPostListModule } from '@blog/service/testing/modules/fixtures';
import { makeRawPostCard } from '@blog/service/testing/pages/fixtures';
import { makeRawHeadingBlock } from '@blog/service/testing/shared/fixtures';
import { makeTenant } from '@blog/service/testing/tenant';

import { getPostList } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

const tenant = makeTenant();

describe('getPostList', () => {
  it('bounds the posts query by the module pageSize and maps the result', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawPostListModule({
          headingBlock: makeRawHeadingBlock('Recent writing'),
          pageSize: 3,
        }),
      )
      .mockResolvedValueOnce({
        posts: [makeRawPostCard({ _id: 'a' })],
        total: 1,
      });

    const postList = await getPostList('post-list-1', 1, tenant);

    // The module's `pageSize` is threaded into the GROQ posts query's slice bound.
    expect(mockRun.mock.calls[1]?.[0]?.query).toContain('[0...3]');
    expect(postList.headingBlock.heading).toBe('Recent writing');
    expect(postList.posts.map((p) => p.id)).toEqual(['a']);
  });

  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(new Error('ValidationError'));

    await expect(getPostList('missing', 1, tenant)).rejects.toThrow();
  });

  it('binds the scope slug as a posts-query parameter when scoped', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawPostListModule({ pageSize: 3 }))
      .mockResolvedValueOnce({
        posts: [makeRawPostCard({ _id: 'a' })],
        total: 1,
      });

    await getPostList('post-list-1', 1, tenant, {
      kind: TAXONOMY_KIND.TAGS,
      slug: 'engineering',
    });

    expect(mockRun).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      expect.objectContaining({
        parameters: { scopeSlug: 'engineering' },
      }),
    );
  });

  it('binds no parameters to the posts query when unscoped', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawPostListModule({ pageSize: 3 }))
      .mockResolvedValueOnce({
        posts: [makeRawPostCard({ _id: 'a' })],
        total: 1,
      });

    await getPostList('post-list-1', 1, tenant);

    expect(mockRun).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      expect.objectContaining({
        parameters: {},
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

    const postList = await getPostList('post-list-1', undefined, tenant);

    expect(mockRun.mock.calls[1]?.[0]?.query).toContain('[0...9]');
    expect(postList.currentPage).toBe(1);
    expect(postList.totalPages).toBe(3);
  });

  it('windows by an explicit page number and derives totalPages from the total match count', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawPostListModule({ pageSize: 9 }))
      .mockResolvedValueOnce({
        posts: [makeRawPostCard({ _id: 'a' })],
        total: 25,
      });

    const postList = await getPostList('post-list-1', 2, tenant);

    expect(mockRun.mock.calls[1]?.[0]?.query).toContain('[9...18]');
    expect(postList.posts.map((p) => p.id)).toEqual(['a']);
    expect(postList.currentPage).toBe(2);
    expect(postList.totalPages).toBe(3); // ceil(25 / 9)
  });

  it('threads tenant context into both queries and scopes their tags to it', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawPostListModule({ pageSize: 3 }))
      .mockResolvedValueOnce({
        posts: [makeRawPostCard({ _id: 'a' })],
        total: 1,
      });

    await getPostList('post-list-1', 1, tenant);

    expect(mockRun).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({
          tags: [
            't:tenant-a:modules:postList',
            't:tenant-a:module:post-list-1',
          ],
        }),
      }),
    );
    expect(mockRun).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({
          tags: [
            't:tenant-a:posts',
            't:tenant-a:author',
            't:tenant-a:topic',
            't:tenant-a:tag',
          ],
        }),
      }),
    );
  });
});
