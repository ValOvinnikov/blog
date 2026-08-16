import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawPostCard } from '@blog/service/testing/pages/fixtures';

import { getPostsByIds } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe(getPostsByIds, () => {
  it('resolves an id list to post-card data', async () => {
    mockRun.mockResolvedValue([
      makeRawPostCard({ _id: 'a' }),
      makeRawPostCard({ _id: 'b' }),
    ]);

    const result = await getPostsByIds(['a', 'b']);

    expect(result.map((post) => post.id)).toEqual(['a', 'b']);
    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ parameters: { ids: ['a', 'b'] } }),
    );
  });

  it('excludes ids that no longer resolve to a published post', async () => {
    // A deleted/unpublished/future-dated post simply doesn't match the
    // query's filters, so it's absent from the raw result — nothing extra
    // for the loader/transformer to check.
    mockRun.mockResolvedValue([makeRawPostCard({ _id: 'a' })]);

    const result = await getPostsByIds(['a', 'deleted-id']);

    expect(result.map((post) => post.id)).toEqual(['a']);
  });

  it('returns an empty array without querying when given no ids', async () => {
    const result = await getPostsByIds([]);

    expect(result).toEqual([]);
    expect(mockRun).not.toHaveBeenCalled();
  });

  it('threads tenant context into runQuery and scopes the tags to it', async () => {
    mockRun.mockResolvedValue([]);
    const tenant = {
      projectId: 'tenant-a',
      dataset: 'production',
      token: 'tok',
    };

    await getPostsByIds(['a'], tenant);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({
          tags: [
            't:tenant-a:posts',
            't:tenant-a:author',
            't:tenant-a:category',
          ],
        }),
      }),
    );
  });

  it('omits tenant scoping when no tenant is given (legacy behavior unchanged)', async () => {
    mockRun.mockResolvedValue([]);

    await getPostsByIds(['a']);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenant: undefined,
        next: expect.objectContaining({
          tags: ['posts', 'author', 'category'],
        }),
      }),
    );
  });
});
