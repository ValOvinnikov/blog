import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { mockRawContactFormModule } from '@blog/service/testing/modules/fixtures';
import {
  MOCK_MISSING_ID,
  mockValidationError,
} from '@blog/service/testing/shared/fixtures';
import { mockTenant } from '@blog/service/testing/tenant';

import { getContactForm } from './loader';
import { contactFormModuleQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

const CONTACT_FORM_ID = 'contact-form-1';

const tenant = mockTenant();

describe('getContactForm', () => {
  beforeEach(() => {
    mockRun.mockResolvedValue(mockRawContactFormModule());
  });

  it('maps the contact form module document', async () => {
    const contactForm = await getContactForm(CONTACT_FORM_ID, tenant);

    expect(contactForm.headingBlock.heading).toBe('Get in touch');
    expect(contactForm.successMessage).toBe(
      "Thanks — I'll reply within two days.",
    );
  });

  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(mockValidationError());

    await expect(getContactForm(MOCK_MISSING_ID, tenant)).rejects.toThrow();
  });

  it('threads tenant context into runQuery and scopes the tags to it', async () => {
    await getContactForm(CONTACT_FORM_ID, tenant);

    expect(mockRun).toHaveBeenCalledWith(contactFormModuleQuery, {
      parameters: { id: CONTACT_FORM_ID },
      tenant,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [
          't:tenant-a:modules:contactForm',
          't:tenant-a:module:contact-form-1',
        ],
      },
    });
  });
});
