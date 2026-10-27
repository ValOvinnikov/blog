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
  mockCacheTag,
} from '@blog/service/testing/sanity/query/cache-tags';
import {
  MOCK_MISSING_ID,
  mockRawHeadingBlock,
  mockValidationError,
} from '@blog/service/testing/shared/fixtures';
import { MOCK_TENANT } from '@blog/service/testing/tenant';
import { faker } from '@faker-js/faker';

import { getFaqModule } from './loader';
import { faqModuleQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

faker.seed(6);

const MOCK_FAQ_HEADING = faker.lorem.words(3);

describe(getFaqModule, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue(
      mockRawFaqModule({
        headingBlock: mockRawHeadingBlock(MOCK_FAQ_HEADING),
      }),
    );
  });

  it('resolves the module with a single query', async () => {
    const faq = await getFaqModule(MOCK_FAQ_MODULE_ID, MOCK_TENANT);

    expect(mockRun).toHaveBeenCalledTimes(1);
    expect(faq.headingBlock.heading).toBe(MOCK_FAQ_HEADING);
  });

  it('returns the referenced questions in authored order', async () => {
    const faq = await getFaqModule(MOCK_FAQ_MODULE_ID, MOCK_TENANT);

    expect(faq.questions.map((question) => question.id)).toEqual([
      MOCK_FAQ_QUESTION_ID,
      MOCK_SECOND_FAQ_QUESTION_ID,
    ]);
  });

  it('propagates when the module document is missing', async () => {
    const error = mockValidationError();
    mockRun.mockRejectedValueOnce(error);

    await expect(getFaqModule(MOCK_MISSING_ID, MOCK_TENANT)).rejects.toBe(
      error,
    );
  });

  it('threads tenant context and scopes cache tags to it', async () => {
    await getFaqModule(MOCK_FAQ_MODULE_ID, MOCK_TENANT);

    expect(mockRun).toHaveBeenCalledWith(faqModuleQuery, {
      parameters: { id: MOCK_FAQ_MODULE_ID },
      tenant: MOCK_TENANT,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [
          MOCK_MODULES_FAQ_CACHE_TAG,
          mockCacheTag(`module:${MOCK_FAQ_MODULE_ID}`),
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
