import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { mockTenant } from '@blog/service/testing/tenant';
import { faker } from '@faker-js/faker';

import { getPaginationParamsWithPageSizes } from './pagination-params';

vi.mock('@blog/service/sanity/query/query');

faker.seed(6018);

const { EN, NL } = LOCALE_ISO_CODES;
const MOCK_LIST_A_ID = faker.string.uuid();
const MOCK_LIST_B_ID = faker.string.uuid();
const MOCK_HERO_ID = faker.string.uuid();
const MOCK_SLUG_A = faker.lorem.slug();
const MOCK_SLUG_B = faker.lorem.slug();
const MOCK_SLUG_C = faker.lorem.slug();
const MOCK_SLUG_D = faker.lorem.slug();
const MOCK_UNPAGINATED_POST_COUNT = 50;
const MOCK_TENANT = mockTenant();

describe(getPaginationParamsWithPageSizes, () => {
  it('pairs each page with its own page size from one request', async () => {
    mockRun.mockResolvedValueOnce([
      { _id: MOCK_LIST_A_ID, pageSize: 9 },
      { _id: MOCK_LIST_B_ID, pageSize: 5 },
    ]);

    const params = await getPaginationParamsWithPageSizes(
      [
        {
          slug: MOCK_SLUG_A,
          language: EN,
          postCount: 20,
          moduleRefs: [{ _ref: MOCK_LIST_A_ID }],
        },
        {
          slug: MOCK_SLUG_B,
          language: NL,
          postCount: 10,
          moduleRefs: [{ _ref: MOCK_LIST_B_ID }],
        },
        {
          slug: MOCK_SLUG_C,
          language: EN,
          postCount: MOCK_UNPAGINATED_POST_COUNT,
          moduleRefs: [{ _ref: MOCK_HERO_ID }],
        },
        {
          slug: MOCK_SLUG_D,
          language: EN,
          postCount: MOCK_UNPAGINATED_POST_COUNT,
          moduleRefs: null,
        },
      ],
      MOCK_TENANT,
    );

    expect(params).toEqual([
      { slug: MOCK_SLUG_A, language: EN, page: '2' },
      { slug: MOCK_SLUG_A, language: EN, page: '3' },
      { slug: MOCK_SLUG_B, language: NL, page: '2' },
    ]);
    expect(mockRun).toHaveBeenCalledTimes(1);
  });
});
