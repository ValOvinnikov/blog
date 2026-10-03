import { resolveNewsletterFromAddress } from './newsletter-from-address';

describe(resolveNewsletterFromAddress, () => {
  it('falls back to the Resend shared testing sender when unset', () => {
    expect(resolveNewsletterFromAddress(undefined)).toBe(
      'Newsletter <onboarding@resend.dev>',
    );
  });

  it('uses the configured address when set', () => {
    expect(
      resolveNewsletterFromAddress('Newsletter <news@mail.example.com>'),
    ).toBe('Newsletter <news@mail.example.com>');
  });
});
