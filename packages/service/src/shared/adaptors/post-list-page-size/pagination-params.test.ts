import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { mockTenant } from '@blog/service/testing/tenant';

import { getPaginationParamsWithPageSizes } from './pagination-params';

vi.mock('@blog/service/sanity/query/query');

const { EN, NL } = LOCALE_ISO_CODES;
const tenant = mockTenant();

describe(getPaginationParamsWithPageSizes, () => {
  it('pairs each page with its own page size from one request', async () => {
    mockRun.mockResolvedValueOnce([
      { _id: 'list-a', pageSize: 9 },
      { _id: 'list-b', pageSize: 5 },
    ]);

    const params = await getPaginationParamsWithPageSizes(
      [
        {
          slug: 'a',
          language: EN,
          postCount: 20,
          moduleRefs: [{ _ref: 'list-a' }],
        },
        {
          slug: 'b',
          language: NL,
          postCount: 10,
          moduleRefs: [{ _ref: 'list-b' }],
        },
        {
          slug: 'c',
          language: EN,
          postCount: 50,
          moduleRefs: [{ _ref: 'hero' }],
        },
        { slug: 'd', language: EN, postCount: 50, moduleRefs: null },
      ],
      tenant,
    );

    expect(params).toEqual([
      { slug: 'a', language: EN, page: '2' },
      { slug: 'a', language: EN, page: '3' },
      { slug: 'b', language: NL, page: '2' },
    ]);
    expect(mockRun).toHaveBeenCalledTimes(1);
  });
});
