import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import { mockRun } from '@blog/service/testing/mock-run-query';
import {
  MOCK_FAQ_MODULE_ID,
  MOCK_FAQ_QUESTION_ID,
  MOCK_SECOND_FAQ_QUESTION_ID,
  mockRawFaqModule,
} from '@blog/service/testing/modules/fixtures';
import {
  MOCK_BLOCK_FAQ_CACHE_TAG,
  MOCK_HOME_PAGE_CACHE_TAG,
  MOCK_LINK_CACHE_TAG,
  MOCK_MODULES_FAQ_CACHE_TAG,
  MOCK_PAGE_LANDING_CACHE_TAG,
  MOCK_PAGE_TAG_CACHE_TAG,
  MOCK_PAGE_TOPIC_CACHE_TAG,
} from '@blog/service/testing/sanity/query/cache-tags';
import {
  MOCK_MISSING_ID,
  mockRawHeadingBlock,
  mockValidationError,
} from '@blog/service/testing/shared/fixtures';
import { mockTenant } from '@blog/service/testing/tenant';

import { getFaqModule } from './loader';
import { faqModuleQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

const FAQ_HEADING = 'Frequently asked questions';

const tenant = mockTenant();

describe(getFaqModule, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue(mockRawFaqModule());
  });

  it('resolves the module in a single round trip — exactly one runQuery call', async () => {
    mockRun.mockResolvedValueOnce(
      mockRawFaqModule({
        headingBlock: mockRawHeadingBlock(FAQ_HEADING),
      }),
    );

    const faq = await getFaqModule(MOCK_FAQ_MODULE_ID, tenant);

    expect(mockRun).toHaveBeenCalledTimes(1);
    expect(faq.headingBlock.heading).toBe(FAQ_HEADING);
  });

  it('returns the referenced questions in authored order', async () => {
    const faq = await getFaqModule(MOCK_FAQ_MODULE_ID, tenant);

    expect(faq.questions.map((question) => question.id)).toEqual([
      MOCK_FAQ_QUESTION_ID,
      MOCK_SECOND_FAQ_QUESTION_ID,
    ]);
  });

  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(mockValidationError());

    await expect(getFaqModule(MOCK_MISSING_ID, tenant)).rejects.toThrow();
    expect(mockRun).toHaveBeenCalledTimes(1);
  });

  it('threads tenant context and scopes cache tags to it', async () => {
    await getFaqModule(MOCK_FAQ_MODULE_ID, tenant);

    expect(mockRun).toHaveBeenCalledTimes(1);
    expect(mockRun).toHaveBeenNthCalledWith(1, faqModuleQuery, {
      parameters: { id: MOCK_FAQ_MODULE_ID },
      tenant,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [
          MOCK_MODULES_FAQ_CACHE_TAG,
          't:tenant-a:module:faq-1',
          MOCK_BLOCK_FAQ_CACHE_TAG,
          MOCK_LINK_CACHE_TAG,
          MOCK_HOME_PAGE_CACHE_TAG,
          MOCK_PAGE_LANDING_CACHE_TAG,
          MOCK_PAGE_TOPIC_CACHE_TAG,
          MOCK_PAGE_TAG_CACHE_TAG,
        ],
      },
    });
  });
});
