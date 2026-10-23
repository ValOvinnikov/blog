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

import { getFaqQuestions } from './loader';
import { faqQuestionsQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

const SECOND_ID = 'faq-2';
const tenant = mockTenant();

describe(getFaqQuestions, () => {
  it('queries the ids once with cache tags scoped to the tenant', async () => {
    mockRun.mockResolvedValueOnce([]);

    await getFaqQuestions([MOCK_FAQ_MODULE_ID, SECOND_ID], tenant);

    expect(mockRun).toHaveBeenCalledExactlyOnceWith(faqQuestionsQuery, {
      parameters: { ids: [MOCK_FAQ_MODULE_ID, SECOND_ID] },
      tenant,
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
      mockRawFaqModuleQuestions({ _id: SECOND_ID }),
    ]);

    const result = await getFaqQuestions(
      [SECOND_ID, MOCK_FAQ_MODULE_ID],
      tenant,
    );

    expect(result.map((module) => module._id)).toEqual([
      SECOND_ID,
      MOCK_FAQ_MODULE_ID,
    ]);
  });
});
