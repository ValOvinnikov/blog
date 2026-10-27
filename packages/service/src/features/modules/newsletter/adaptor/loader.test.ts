import {
  NEWSLETTER_VARIANT,
  SANITY_CONTENT_REVALIDATE_SECONDS,
} from '@blog/config';
import { mockRun } from '@blog/service/testing/mock-run-query';
import {
  MOCK_NEWSLETTER_MODULE_ID,
  mockRawNewsletterModule,
} from '@blog/service/testing/modules/fixtures';
import { mockCacheTag } from '@blog/service/testing/sanity/query/cache-tags';
import {
  MOCK_MISSING_ID,
  mockRawHeadingBlock,
  mockValidationError,
} from '@blog/service/testing/shared/fixtures';
import { MOCK_TENANT } from '@blog/service/testing/tenant';
import { faker } from '@faker-js/faker';

import { getNewsletter } from './loader';
import { newsletterModuleQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

faker.seed(10);

const MOCK_HEADING = faker.lorem.words(3);
const MOCK_SUPPORTING_TEXT = faker.lorem.sentence();

describe(getNewsletter, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue(
      mockRawNewsletterModule({
        headingBlock: mockRawHeadingBlock(MOCK_HEADING, {
          supportingText: MOCK_SUPPORTING_TEXT,
        }),
        variant: NEWSLETTER_VARIANT.COMPACT,
      }),
    );
  });

  it('maps the newsletter module document', async () => {
    const newsletter = await getNewsletter(
      MOCK_NEWSLETTER_MODULE_ID,
      MOCK_TENANT,
    );

    expect(newsletter.headingBlock.heading).toBe(MOCK_HEADING);
    expect(newsletter.headingBlock.supportingText).toBe(MOCK_SUPPORTING_TEXT);
    expect(newsletter.variant).toBe(NEWSLETTER_VARIANT.COMPACT);
  });

  it('propagates when the module document is missing', async () => {
    const error = mockValidationError();
    mockRun.mockRejectedValueOnce(error);

    await expect(getNewsletter(MOCK_MISSING_ID, MOCK_TENANT)).rejects.toBe(
      error,
    );
  });

  it('threads tenant context into the query and scopes the tags to it', async () => {
    await getNewsletter(MOCK_NEWSLETTER_MODULE_ID, MOCK_TENANT);

    expect(mockRun).toHaveBeenCalledWith(newsletterModuleQuery, {
      parameters: { id: MOCK_NEWSLETTER_MODULE_ID },
      tenant: MOCK_TENANT,
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
