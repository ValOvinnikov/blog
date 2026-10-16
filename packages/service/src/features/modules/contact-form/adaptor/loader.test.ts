import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawContactFormModule } from '@blog/service/testing/modules/fixtures';
import { makeTenant } from '@blog/service/testing/tenant';

import { getContactForm } from './loader';

vi.mock('@blog/service/sanity/query/query', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@blog/service/sanity/query/query')
  >()),
  runQuery: vi.fn(),
}));

const tenant = makeTenant();

describe('getContactForm', () => {
  it('maps the contact form module document', async () => {
    mockRun.mockResolvedValueOnce(makeRawContactFormModule());

    const contactForm = await getContactForm('contact-form-1', tenant);

    expect(contactForm.headingBlock.heading).toBe('Get in touch');
    expect(contactForm.successMessage).toBe(
      "Thanks — I'll reply within two days.",
    );
  });

  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(new Error('ValidationError'));

    await expect(getContactForm('missing', tenant)).rejects.toThrow();
  });

  it('threads tenant context into runQuery and scopes the tags to it', async () => {
    mockRun.mockResolvedValue(makeRawContactFormModule());

    await getContactForm('contact-form-1', tenant);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({
          tags: [
            't:tenant-a:modules:contactForm',
            't:tenant-a:module:contact-form-1',
          ],
        }),
      }),
    );
  });
});
