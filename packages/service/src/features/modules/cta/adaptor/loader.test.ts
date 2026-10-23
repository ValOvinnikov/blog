import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import { mockRun } from '@blog/service/testing/mock-run-query';
import {
  MOCK_CTA_BUTTON_URL,
  MOCK_CTA_MODULE_ID,
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
} from '@blog/service/testing/sanity/query/cache-tags';
import {
  MOCK_MISSING_ID,
  mockValidationError,
} from '@blog/service/testing/shared/fixtures';
import { mockTenant } from '@blog/service/testing/tenant';

import { getCta } from './loader';
import { ctaModuleQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

const tenant = mockTenant();

describe('getCta', () => {
  beforeEach(() => {
    mockRun.mockResolvedValue(
      mockRawCtaModule({ ctaButtons: [mockRawCtaButton()] }),
    );
  });

  it('maps the cta module document', async () => {
    const cta = await getCta(MOCK_CTA_MODULE_ID, tenant);

    expect(cta.headingBlock.heading).toBe('Subscribe to the newsletter');
    expect(cta.ctaButtons?.[0]?.link.href).toBe(MOCK_CTA_BUTTON_URL);
  });

  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(mockValidationError());

    await expect(getCta(MOCK_MISSING_ID, tenant)).rejects.toThrow();
  });

  it('threads tenant context into runQuery and scopes the tags to it', async () => {
    await getCta(MOCK_CTA_MODULE_ID, tenant);

    expect(mockRun).toHaveBeenCalledWith(ctaModuleQuery, {
      parameters: { id: MOCK_CTA_MODULE_ID },
      tenant,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [
          't:tenant-a:modules:cta',
          't:tenant-a:module:cta-1',
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
