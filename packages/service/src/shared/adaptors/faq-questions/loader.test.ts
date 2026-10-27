import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import { mockRun } from '@blog/service/testing/mock-run-query';
import {
  MOCK_FAQ_MODULE_ID,
  mockRawFaqModuleQuestions,
} from '@blog/service/testing/modules/fixtures';
import {
  MOCK_BLOCK_FAQ_CACHE_TAG,
  MOCK_LINK_CACHE_TAG,
  MOCK_MODULES_FAQ_CACHE_TAG,
} from '@blog/service/testing/sanity/query/cache-tags';
import { mockTenant } from '@blog/service/testing/tenant';
import { faker } from '@faker-js/faker';

import { getFaqQuestions } from './loader';
import { faqQuestionsQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

faker.seed(6020);

const MOCK_SECOND_FAQ_MODULE_ID = faker.string.uuid();
const MOCK_TENANT = mockTenant();

describe(getFaqQuestions, () => {
  it('queries the ids once with cache tags scoped to the tenant', async () => {
    mockRun.mockResolvedValueOnce([]);

    await getFaqQuestions(
      [MOCK_FAQ_MODULE_ID, MOCK_SECOND_FAQ_MODULE_ID],
      MOCK_TENANT,
    );

    expect(mockRun).toHaveBeenCalledExactlyOnceWith(faqQuestionsQuery, {
      parameters: { ids: [MOCK_FAQ_MODULE_ID, MOCK_SECOND_FAQ_MODULE_ID] },
      tenant: MOCK_TENANT,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [
          MOCK_MODULES_FAQ_CACHE_TAG,
          MOCK_BLOCK_FAQ_CACHE_TAG,
          MOCK_LINK_CACHE_TAG,
        ],
      },
    });
  });

  it('returns the modules in the order of the given ids', async () => {
    mockRun.mockResolvedValueOnce([
      mockRawFaqModuleQuestions({ _id: MOCK_FAQ_MODULE_ID }),
      mockRawFaqModuleQuestions({ _id: MOCK_SECOND_FAQ_MODULE_ID }),
    ]);

    const result = await getFaqQuestions(
      [MOCK_SECOND_FAQ_MODULE_ID, MOCK_FAQ_MODULE_ID],
      MOCK_TENANT,
    );
    const ids = result.map((module) => module._id);

    expect(ids).toEqual([MOCK_SECOND_FAQ_MODULE_ID, MOCK_FAQ_MODULE_ID]);
  });
});
