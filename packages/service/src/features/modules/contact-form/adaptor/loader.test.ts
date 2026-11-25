import { faker } from '@faker-js/faker';
import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@shinefold/config';
import { mockRun } from '@shinefold/service/testing/mock-run-query';
import { mockRawContactFormModule } from '@shinefold/service/testing/modules/fixtures';
import {
  MOCK_LINK_TARGET_CACHE_TAGS,
  mockCacheTag,
} from '@shinefold/service/testing/sanity/query/cache-tags';
import {
  MOCK_MISSING_ID,
  mockValidationError,
} from '@shinefold/service/testing/shared/fixtures';
import { mockRawModuleHeadingBlock } from '@shinefold/service/testing/shared/localized';
import { MOCK_TENANT } from '@shinefold/service/testing/tenant';

import { getContactForm } from './loader';
import { contactFormModuleQuery } from './query';

vi.mock('@shinefold/service/sanity/query/query');

faker.seed(10);

const MOCK_CONTACT_FORM_ID = faker.string.uuid();
const MOCK_HEADING = faker.lorem.words(3);
const MOCK_SUCCESS_MESSAGE = faker.lorem.sentence();

describe(getContactForm, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue(
      mockRawContactFormModule({
        headingBlock: mockRawModuleHeadingBlock(MOCK_HEADING),
        successMessage: MOCK_SUCCESS_MESSAGE,
      }),
    );
  });

  it('maps the contact form module document', async () => {
    const contactForm = await getContactForm(MOCK_CONTACT_FORM_ID, MOCK_TENANT);

    expect(contactForm.headingBlock.heading).toBe(MOCK_HEADING);
    expect(contactForm.successMessage).toBe(MOCK_SUCCESS_MESSAGE);
  });

  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(mockValidationError());

    await expect(
      getContactForm(MOCK_MISSING_ID, MOCK_TENANT),
    ).rejects.toThrow();
  });

  it('queries with the tenant and the cache tags scoped to it', async () => {
    await getContactForm(MOCK_CONTACT_FORM_ID, MOCK_TENANT);

    expect(mockRun).toHaveBeenCalledWith(contactFormModuleQuery, {
      parameters: { id: MOCK_CONTACT_FORM_ID },
      tenant: MOCK_TENANT,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [
          mockCacheTag('modules:contactForm'),
          mockCacheTag(`module:${MOCK_CONTACT_FORM_ID}`),
          ...MOCK_LINK_TARGET_CACHE_TAGS,
        ],
      },
    });
  });
});
