import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import { mockRun } from '@blog/service/testing/mock-run-query';
import {
  MOCK_CTA_BUTTON_URL,
  mockRawCtaButton,
  mockRawCtaModule,
} from '@blog/service/testing/modules/fixtures';
import {
  MOCK_HOME_PAGE_CACHE_TAG,
  MOCK_LINK_CACHE_TAG,
  MOCK_PAGE_LANDING_CACHE_TAG,
  MOCK_PAGE_POST_CACHE_TAG,
  MOCK_PAGE_POST_INDEX_CACHE_TAG,
  MOCK_PAGE_TAG_CACHE_TAG,
  MOCK_PAGE_TAG_INDEX_CACHE_TAG,
  MOCK_PAGE_TOPIC_CACHE_TAG,
  MOCK_PAGE_TOPIC_INDEX_CACHE_TAG,
  MOCK_TOPIC_CACHE_TAG,
  mockCacheTag,
} from '@blog/service/testing/sanity/query/cache-tags';
import {
  MOCK_MISSING_ID,
  mockRawHeadingBlock,
  mockValidationError,
} from '@blog/service/testing/shared/fixtures';
import { MOCK_TENANT } from '@blog/service/testing/tenant';
import { faker } from '@faker-js/faker';

import { getCta } from './loader';
import { ctaModuleQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

faker.seed(6014);

const MOCK_CTA_ID = faker.string.uuid();
const MOCK_HEADING = faker.lorem.words(3);

describe(getCta, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue(
      mockRawCtaModule({
        headingBlock: mockRawHeadingBlock(MOCK_HEADING),
        ctaButtons: [mockRawCtaButton()],
      }),
    );
  });

  it('maps the cta module document', async () => {
    const cta = await getCta(MOCK_CTA_ID, MOCK_TENANT);

    expect(cta.headingBlock.heading).toBe(MOCK_HEADING);
    expect(cta.ctaButtons?.[0]?.link.href).toBe(MOCK_CTA_BUTTON_URL);
  });

  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(mockValidationError());

    await expect(getCta(MOCK_MISSING_ID, MOCK_TENANT)).rejects.toThrow();
  });

  it('fetches for the tenant with tags scoped to the module', async () => {
    await getCta(MOCK_CTA_ID, MOCK_TENANT);

    expect(mockRun).toHaveBeenCalledWith(ctaModuleQuery, {
      parameters: { id: MOCK_CTA_ID },
      tenant: MOCK_TENANT,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [
          mockCacheTag('modules:cta'),
          mockCacheTag(`module:${MOCK_CTA_ID}`),
          MOCK_LINK_CACHE_TAG,
          MOCK_HOME_PAGE_CACHE_TAG,
          MOCK_PAGE_LANDING_CACHE_TAG,
          MOCK_PAGE_POST_CACHE_TAG,
          MOCK_PAGE_POST_INDEX_CACHE_TAG,
          MOCK_PAGE_TOPIC_CACHE_TAG,
          MOCK_PAGE_TOPIC_INDEX_CACHE_TAG,
          MOCK_PAGE_TAG_CACHE_TAG,
          MOCK_PAGE_TAG_INDEX_CACHE_TAG,
          MOCK_TOPIC_CACHE_TAG,
        ],
      },
    });
  });
});
