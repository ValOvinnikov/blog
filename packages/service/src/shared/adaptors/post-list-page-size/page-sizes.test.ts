import { mockRun } from '@blog/service/testing/mock-run-query';
import { mockTenant } from '@blog/service/testing/tenant';
import { faker } from '@faker-js/faker';

import { getFirstPostListPageSizes } from './page-sizes';

vi.mock('@blog/service/sanity/query/query');

faker.seed(6017);

const MOCK_HERO_ID = faker.string.uuid();
const MOCK_LIST_A_ID = faker.string.uuid();
const MOCK_LIST_B_ID = faker.string.uuid();
const MOCK_LIST_A_PAGE_SIZE = 5;
const MOCK_LIST_B_PAGE_SIZE = 9;
const MOCK_TENANT = mockTenant();

describe(getFirstPostListPageSizes, () => {
  describe('with post lists on some pages', () => {
    let sizes: Awaited<ReturnType<typeof getFirstPostListPageSizes>>;

    beforeEach(async () => {
      mockRun.mockResolvedValueOnce([
        { _id: MOCK_LIST_A_ID, pageSize: MOCK_LIST_A_PAGE_SIZE },
        { _id: MOCK_LIST_B_ID, pageSize: MOCK_LIST_B_PAGE_SIZE },
      ]);

      sizes = await getFirstPostListPageSizes(
        [
          [{ _ref: MOCK_HERO_ID }, { _ref: MOCK_LIST_A_ID }],
          [{ _ref: MOCK_HERO_ID }],
          null,
          [{ _ref: MOCK_LIST_B_ID }, { _ref: MOCK_LIST_A_ID }],
        ],
        MOCK_TENANT,
      );
    });

    it("maps each page to its first post list's page size", () => {
      expect(sizes).toEqual([
        MOCK_LIST_A_PAGE_SIZE,
        null,
        null,
        MOCK_LIST_B_PAGE_SIZE,
      ]);
    });

    it('fetches every distinct module id in one request', () => {
      const parameters = mockRun.mock.lastCall?.[1]?.parameters;

      expect(mockRun).toHaveBeenCalledTimes(1);
      expect(parameters).toEqual({
        ids: [MOCK_HERO_ID, MOCK_LIST_A_ID, MOCK_LIST_B_ID],
      });
    });
  });

  it('makes no request when no page has modules', async () => {
    const sizes = await getFirstPostListPageSizes([null, []], MOCK_TENANT);

    expect(sizes).toEqual([null, null]);
    expect(mockRun).not.toHaveBeenCalled();
  });
});
