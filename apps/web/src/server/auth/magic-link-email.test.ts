import { buildMagicLinkEmail } from './magic-link-email';

describe(buildMagicLinkEmail, () => {
  it('builds a subject that names the host', () => {
    const { subject } = buildMagicLinkEmail({
      url: 'https://example.com/api/auth/callback/email?token=abc',
      host: 'example.com',
    });

    expect(subject).toBe('Sign in to example.com');
  });

  it('links the magic-link url in the html body', () => {
    const { html } = buildMagicLinkEmail({
      url: 'https://example.com/api/auth/callback/email?token=abc',
      host: 'example.com',
    });

    expect(html).toContain(
      'href="https://example.com/api/auth/callback/email?token=abc"',
    );
  });
});
