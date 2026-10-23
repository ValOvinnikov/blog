import {
  NEWSLETTER_VARIANT,
  SANITY_CONTENT_REVALIDATE_SECONDS,
} from '@blog/config';
import { mockRun } from '@blog/service/testing/mock-run-query';
import {
  MOCK_NEWSLETTER_HEADING,
  MOCK_NEWSLETTER_MODULE_ID,
  mockRawNewsletterModule,
} from '@blog/service/testing/modules/fixtures';
import { mockCacheTag } from '@blog/service/testing/sanity/query/cache-tags';
import {
  MOCK_MISSING_ID,
  mockValidationError,
} from '@blog/service/testing/shared/fixtures';
import { mockTenant } from '@blog/service/testing/tenant';

import { getNewsletter } from './loader';
import { newsletterModuleQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

const tenant = mockTenant();

describe(getNewsletter, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue(mockRawNewsletterModule());
  });

  it('maps the newsletter module document', async () => {
    const newsletter = await getNewsletter(MOCK_NEWSLETTER_MODULE_ID, tenant);

    expect(newsletter.headingBlock.heading).toBe(MOCK_NEWSLETTER_HEADING);
    expect(newsletter.headingBlock.supportingText).toBe(
      'Get new posts in your inbox.',
    );
    expect(newsletter.variant).toBe(NEWSLETTER_VARIANT.FULL);
  });

  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(mockValidationError());

    await expect(getNewsletter(MOCK_MISSING_ID, tenant)).rejects.toThrow();
  });

  it('threads tenant context into the query and scopes the tags to it', async () => {
    await getNewsletter(MOCK_NEWSLETTER_MODULE_ID, tenant);

    expect(mockRun).toHaveBeenCalledWith(newsletterModuleQuery, {
      parameters: { id: MOCK_NEWSLETTER_MODULE_ID },
      tenant,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [
          mockCacheTag('modules:newsletter'),
          mockCacheTag(`module:${MOCK_NEWSLETTER_MODULE_ID}`),
        ],
      },
    });
  });
});
