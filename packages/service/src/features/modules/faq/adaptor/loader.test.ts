import { faker } from '@faker-js/faker';
import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@shinefold/config';
import { mockRun } from '@shinefold/service/testing/mock-run-query';
import { mockRawFaqModule } from '@shinefold/service/testing/modules/faq/fixtures';
import {
  MOCK_FAQ_MODULE_ID,
  MOCK_FAQ_QUESTION_ID,
  MOCK_SECOND_FAQ_QUESTION_ID,
} from '@shinefold/service/testing/modules/fixtures';
import {
  MOCK_BLOCK_FAQ_CACHE_TAG,
  MOCK_LINK_TARGET_CACHE_TAGS,
  MOCK_MODULES_FAQ_CACHE_TAG,
  mockCacheTag,
} from '@shinefold/service/testing/sanity/query/cache-tags';
import {
  MOCK_MISSING_ID,
  mockRawHeadingBlock,
  mockValidationError,
} from '@shinefold/service/testing/shared/fixtures';
import { MOCK_TENANT } from '@shinefold/service/testing/tenant';

import { getFaqModule } from './loader';
import { faqModuleQuery } from './query';

vi.mock('@shinefold/service/sanity/query/query');

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

  it('resolves the module and its questions in authored order with a single query', async () => {
    const faq = await getFaqModule(MOCK_FAQ_MODULE_ID, MOCK_TENANT);

    expect(mockRun).toHaveBeenCalledTimes(1);
    expect(faq.headingBlock.heading).toBe(MOCK_FAQ_HEADING);
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
          ...MOCK_LINK_TARGET_CACHE_TAGS,
        ],
      },
    });
  });
});
