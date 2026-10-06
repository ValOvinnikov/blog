import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeTenant } from '@blog/service/testing/tenant';

import { getPaginationParamsWithPageSizes } from './pagination-params';

vi.mock('@blog/service/sanity/query/query', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@blog/service/sanity/query/query')
  >()),
  runQuery: vi.fn(),
}));

const tenant = makeTenant();

describe(getPaginationParamsWithPageSizes, () => {
  it('pairs each page with its own page size from one request', async () => {
    mockRun.mockResolvedValueOnce([
      { _id: 'list-a', pageSize: 9 },
      { _id: 'list-b', pageSize: 5 },
    ]);

    const params = await getPaginationParamsWithPageSizes(
      [
        { slug: 'a', postCount: 20, moduleRefs: [{ _ref: 'list-a' }] },
        { slug: 'b', postCount: 10, moduleRefs: [{ _ref: 'list-b' }] },
        { slug: 'c', postCount: 50, moduleRefs: [{ _ref: 'hero' }] },
        { slug: 'd', postCount: 50, moduleRefs: null },
      ],
      tenant,
    );

    expect(params).toEqual([
      { slug: 'a', page: '2' },
      { slug: 'a', page: '3' },
      { slug: 'b', page: '2' },
    ]);
    expect(mockRun).toHaveBeenCalledTimes(1);
  });
});
