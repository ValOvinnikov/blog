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

  it('escapes HTML-unsafe characters in host and url', () => {
    const { html } = buildMagicLinkEmail({
      url: `https://example.com/callback?token="><img src=x onerror=alert(1)>`,
      host: `<script>alert(1)</script>`,
    });

    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).not.toContain('"><img src=x onerror=alert(1)>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).toContain('&quot;&gt;&lt;img src=x onerror=alert(1)&gt;');
  });
});
