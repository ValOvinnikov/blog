import { faker } from '@faker-js/faker';
import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@shinefold/config';
import { mockRun } from '@shinefold/service/testing/mock-run-query';
import {
  MOCK_CTA_BUTTON_URL,
  mockRawCtaButton,
  mockRawCtaModule,
} from '@shinefold/service/testing/modules/fixtures';
import {
  MOCK_LINK_TARGET_CACHE_TAGS,
  MOCK_TOPIC_CACHE_TAG,
  mockCacheTag,
} from '@shinefold/service/testing/sanity/query/cache-tags';
import {
  MOCK_MISSING_ID,
  mockValidationError,
} from '@shinefold/service/testing/shared/fixtures';
import { mockRawModuleHeadingBlock } from '@shinefold/service/testing/shared/localized';
import { MOCK_TENANT } from '@shinefold/service/testing/tenant';

import { getCta } from './loader';
import { ctaModuleQuery } from './query';

vi.mock('@shinefold/service/sanity/query/query');

faker.seed(6014);

const MOCK_CTA_ID = faker.string.uuid();
const MOCK_HEADING = faker.lorem.words(3);

describe(getCta, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue(
      mockRawCtaModule({
        headingBlock: mockRawModuleHeadingBlock(MOCK_HEADING),
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
          MOCK_TOPIC_CACHE_TAG,
          ...MOCK_LINK_TARGET_CACHE_TAGS,
        ],
      },
    });
  });
});
