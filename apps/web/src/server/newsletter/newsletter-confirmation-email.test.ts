import { buildNewsletterConfirmationEmail } from './newsletter-confirmation-email';

describe(buildNewsletterConfirmationEmail, () => {
  it('builds a subject naming the confirmation', () => {
    const { subject } = buildNewsletterConfirmationEmail({
      confirmationUrl: 'https://example.com/api/newsletter/confirm?token=abc',
    });

    expect(subject).toBe('Confirm your subscription');
  });

  it('links the confirmation url in the html body', () => {
    const { html } = buildNewsletterConfirmationEmail({
      confirmationUrl: 'https://example.com/api/newsletter/confirm?token=abc',
    });

    expect(html).toContain(
      'href="https://example.com/api/newsletter/confirm?token=abc"',
    );
  });
});
