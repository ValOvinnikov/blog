import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeTenant } from '@blog/service/testing/tenant';

import { getPostListPageSizes } from './loader';

vi.mock('@blog/service/sanity/query/query', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@blog/service/sanity/query/query')
  >()),
  runQuery: vi.fn(),
}));

const tenant = makeTenant();

describe(getPostListPageSizes, () => {
  it('passes the ids as the query parameter and scopes cache tags to the tenant', async () => {
    mockRun.mockResolvedValueOnce([]);

    await getPostListPageSizes(['list-1', 'list-2'], tenant);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        parameters: { ids: ['list-1', 'list-2'] },
        tenant,
        next: expect.objectContaining({
          tags: ['t:tenant-a:modules:postList'],
        }),
      }),
    );
  });

  it('makes no request when given no ids', async () => {
    const result = await getPostListPageSizes([], tenant);

    expect(result).toEqual([]);
    expect(mockRun).not.toHaveBeenCalled();
  });
});
