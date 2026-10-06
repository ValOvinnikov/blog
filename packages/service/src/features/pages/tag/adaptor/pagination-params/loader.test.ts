import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeTenant } from '@blog/service/testing/tenant';

import { getTagPaginationParams } from './loader';

vi.mock('@blog/service/sanity/query/query', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@blog/service/sanity/query/query')
  >()),
  runQuery: vi.fn(),
}));

const tenant = makeTenant();

describe('getTagPaginationParams', () => {
  it('delegates the raw query result to the pagination transformer', async () => {
    mockRun
      .mockResolvedValueOnce([
        { slug: 'typescript', moduleRefs: [{ _ref: 'list-1' }], postCount: 20 },
        { slug: 'react', moduleRefs: [{ _ref: 'list-1' }], postCount: 9 },
        { slug: 'no-list', moduleRefs: [{ _ref: 'hero-1' }], postCount: 50 },
      ])
      .mockResolvedValueOnce([{ _id: 'list-1', pageSize: 9 }]);

    const params = await getTagPaginationParams(tenant);

    expect(params).toEqual([
      { slug: 'typescript', page: '2' },
      { slug: 'typescript', page: '3' },
    ]);
  });

  it('threads tenant context into runQuery and scopes the tags to it', async () => {
    mockRun.mockResolvedValueOnce([]);

    await getTagPaginationParams(tenant);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({
          tags: [
            't:tenant-a:page_tag',
            't:tenant-a:template_tag',
            't:tenant-a:posts',
            't:tenant-a:tag',
          ],
        }),
      }),
    );
  });

  it('fetches the page sizes of all pages in one request', async () => {
    mockRun
      .mockResolvedValueOnce([
        { slug: 'typescript', moduleRefs: [{ _ref: 'list-1' }], postCount: 20 },
        { slug: 'react', moduleRefs: [{ _ref: 'list-2' }], postCount: 20 },
      ])
      .mockResolvedValueOnce([]);

    await getTagPaginationParams(tenant);

    expect(mockRun).toHaveBeenCalledTimes(2);
    expect(mockRun).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ parameters: { ids: ['list-1', 'list-2'] } }),
    );
  });
});
