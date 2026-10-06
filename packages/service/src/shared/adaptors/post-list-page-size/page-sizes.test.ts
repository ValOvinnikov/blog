import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeTenant } from '@blog/service/testing/tenant';

import { getFirstPostListPageSizes } from './page-sizes';

vi.mock('@blog/service/sanity/query/query', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@blog/service/sanity/query/query')
  >()),
  runQuery: vi.fn(),
}));

const tenant = makeTenant();

describe(getFirstPostListPageSizes, () => {
  it('fetches every page in one request and maps each page back to its size', async () => {
    mockRun.mockResolvedValueOnce([
      { _id: 'list-a', pageSize: 5 },
      { _id: 'list-b', pageSize: 9 },
    ]);

    const sizes = await getFirstPostListPageSizes(
      [
        [{ _ref: 'hero' }, { _ref: 'list-a' }],
        [{ _ref: 'hero' }],
        null,
        [{ _ref: 'list-b' }, { _ref: 'list-a' }],
      ],
      tenant,
    );

    expect(sizes).toEqual([5, null, null, 9]);
    expect(mockRun).toHaveBeenCalledTimes(1);
    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        parameters: { ids: ['hero', 'list-a', 'list-b'] },
      }),
    );
  });

  it('makes no request when no page has modules', async () => {
    const sizes = await getFirstPostListPageSizes([null, []], tenant);

    expect(sizes).toEqual([null, null]);
    expect(mockRun).not.toHaveBeenCalled();
  });
});
