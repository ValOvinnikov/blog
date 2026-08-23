import { buildInviteMagicLinkEmail } from './magic-link-invite-email';

describe(buildInviteMagicLinkEmail, () => {
  it('names a single tenant in the subject and body', () => {
    const { subject, html } = buildInviteMagicLinkEmail({
      url: 'https://example.com/api/auth/callback/email?token=abc',
      host: 'example.com',
      tenantNames: ['Acme Blog'],
    });

    expect(subject).toBe("You've been invited to manage Acme Blog");
    expect(html).toContain('<strong>Acme Blog</strong>');
  });

  it('joins two tenant names with "and"', () => {
    const { subject } = buildInviteMagicLinkEmail({
      url: 'https://example.com/api/auth/callback/email?token=abc',
      host: 'example.com',
      tenantNames: ['Acme Blog', 'Other Corp'],
    });

    expect(subject).toBe(
      "You've been invited to manage Acme Blog and Other Corp",
    );
  });

  it('joins three or more tenant names with an Oxford comma', () => {
    const { subject } = buildInviteMagicLinkEmail({
      url: 'https://example.com/api/auth/callback/email?token=abc',
      host: 'example.com',
      tenantNames: ['Acme Blog', 'Other Corp', 'Third Co'],
    });

    expect(subject).toBe(
      "You've been invited to manage Acme Blog, Other Corp, and Third Co",
    );
  });

  it('links the magic-link url in the html body', () => {
    const { html } = buildInviteMagicLinkEmail({
      url: 'https://example.com/api/auth/callback/email?token=abc',
      host: 'example.com',
      tenantNames: ['Acme Blog'],
    });

    expect(html).toContain(
      'href="https://example.com/api/auth/callback/email?token=abc"',
    );
  });

  it('escapes HTML-unsafe characters in an operator-entered tenant name', () => {
    const { html } = buildInviteMagicLinkEmail({
      url: 'https://example.com/api/auth/callback/email?token=abc',
      host: 'example.com',
      tenantNames: [`<script>alert(1)</script> & "quoted" 'name'`],
    });

    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain(
      '&lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;quoted&quot; &#39;name&#39;',
    );
  });
});
