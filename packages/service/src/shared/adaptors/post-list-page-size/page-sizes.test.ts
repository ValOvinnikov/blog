import { mockRun } from '@blog/service/testing/mock-run-query';
import { mockTenant } from '@blog/service/testing/tenant';

import { getFirstPostListPageSizes } from './page-sizes';

vi.mock('@blog/service/sanity/query/query');

const HERO_ID = 'hero';
const LIST_A_ID = 'list-a';
const LIST_B_ID = 'list-b';
const tenant = mockTenant();

describe(getFirstPostListPageSizes, () => {
  it('fetches every page in one request and maps each page to its size', async () => {
    mockRun.mockResolvedValueOnce([
      { _id: LIST_A_ID, pageSize: 5 },
      { _id: LIST_B_ID, pageSize: 9 },
    ]);

    const sizes = await getFirstPostListPageSizes(
      [
        [{ _ref: HERO_ID }, { _ref: LIST_A_ID }],
        [{ _ref: HERO_ID }],
        null,
        [{ _ref: LIST_B_ID }, { _ref: LIST_A_ID }],
      ],
      tenant,
    );

    const parameters = mockRun.mock.calls[0]?.[1]?.parameters;

    expect(sizes).toEqual([5, null, null, 9]);
    expect(mockRun).toHaveBeenCalledTimes(1);
    expect(parameters).toEqual({ ids: [HERO_ID, LIST_A_ID, LIST_B_ID] });
  });

  it('makes no request when no page has modules', async () => {
    const sizes = await getFirstPostListPageSizes([null, []], tenant);

    expect(sizes).toEqual([null, null]);
    expect(mockRun).not.toHaveBeenCalled();
  });
});
