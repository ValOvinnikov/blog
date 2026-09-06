import { resolveTenantEmailBrand } from '@blog/config';
import { PRESET_ID } from '@blog/config/constants';
import type { TPortableTextContent } from '@blog/email';

import { buildInviteMagicLinkEmail } from './magic-link-invite-email';

const bodyOf = (text: string): TPortableTextContent => [
  {
    _type: 'block',
    _key: 'body-1',
    style: 'normal',
    children: [{ _type: 'span', _key: 'body-1-span', text, marks: [] }],
  },
];

describe(buildInviteMagicLinkEmail, () => {
  it('passes the resolved subject through unchanged', () => {
    const { subject } = buildInviteMagicLinkEmail({
      url: 'https://example.com/api/auth/callback/email?token=abc',
      subject: "You've been invited to join the team",
      body: bodyOf('You have been invited to join as a team member.'),
      tenantNames: ['Acme Blog'],
    });

    expect(subject).toBe("You've been invited to join the team");
  });

  it('renders the resolved body through the shared Portable Text serializer', () => {
    const { html } = buildInviteMagicLinkEmail({
      url: 'https://example.com/api/auth/callback/email?token=abc',
      subject: "You've been invited to join the team",
      body: bodyOf('You have been invited to join as a team member.'),
      tenantNames: ['Acme Blog'],
    });

    expect(html).toContain('You have been invited to join as a team member.');
  });

  it('names a single invited tenant in the structural organisation element', () => {
    const { html } = buildInviteMagicLinkEmail({
      url: 'https://example.com/api/auth/callback/email?token=abc',
      subject: "You've been invited to join the team",
      body: bodyOf('You have been invited to join as a team member.'),
      tenantNames: ['Acme Blog'],
    });

    expect(html).toContain('<strong>Acme Blog</strong>');
  });

  it('joins two invited tenant names with "and"', () => {
    const { html } = buildInviteMagicLinkEmail({
      url: 'https://example.com/api/auth/callback/email?token=abc',
      subject: "You've been invited to join the team",
      body: bodyOf('You have been invited to join as a team member.'),
      tenantNames: ['Acme Blog', 'Other Corp'],
    });

    expect(html).toContain('<strong>Acme Blog and Other Corp</strong>');
  });

  it('joins three or more invited tenant names with an Oxford comma', () => {
    const { html } = buildInviteMagicLinkEmail({
      url: 'https://example.com/api/auth/callback/email?token=abc',
      subject: "You've been invited to join the team",
      body: bodyOf('You have been invited to join as a team member.'),
      tenantNames: ['Acme Blog', 'Other Corp', 'Third Co'],
    });

    expect(html).toContain(
      '<strong>Acme Blog, Other Corp, and Third Co</strong>',
    );
  });

  it('escapes HTML-unsafe characters in an operator-entered tenant name', () => {
    const { html } = buildInviteMagicLinkEmail({
      url: 'https://example.com/api/auth/callback/email?token=abc',
      subject: "You've been invited to join the team",
      body: bodyOf('You have been invited to join as a team member.'),
      tenantNames: [`<script>alert(1)</script> & "quoted" 'name'`],
    });

    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain(
      '&lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;quoted&quot; &#39;name&#39;',
    );
  });

  it('omits the organisation element and still sends when no tenant names are given', () => {
    const { html } = buildInviteMagicLinkEmail({
      url: 'https://example.com/api/auth/callback/email?token=abc',
      subject: "You've been invited to join the team",
      body: bodyOf('You have been invited to join as a team member.'),
    });

    expect(html).not.toContain("You've been invited to manage");
    expect(html).toContain(
      'href="https://example.com/api/auth/callback/email?token=abc"',
    );
  });

  it('links the magic-link url in the accept-invite action', () => {
    const { html } = buildInviteMagicLinkEmail({
      url: 'https://example.com/api/auth/callback/email?token=abc',
      subject: "You've been invited to join the team",
      body: bodyOf('You have been invited to join as a team member.'),
      tenantNames: ['Acme Blog'],
    });

    expect(html).toContain(
      'href="https://example.com/api/auth/callback/email?token=abc"',
    );
    expect(html).toContain('Accept invite');
  });

  it('escapes an unsafe url in the unbranded fallback link', () => {
    const { html } = buildInviteMagicLinkEmail({
      url: `https://example.com/callback?token="><img src=x onerror=alert(1)>`,
      subject: "You've been invited to join the team",
      body: bodyOf('You have been invited to join as a team member.'),
      tenantNames: ['Acme Blog'],
    });

    expect(html).not.toContain('"><img src=x onerror=alert(1)>');
    expect(html).toContain('&quot;&gt;&lt;img src=x onerror=alert(1)&gt;');
  });

  it('renders plain, unstyled html when no tenant identity is given', () => {
    const { html } = buildInviteMagicLinkEmail({
      url: 'https://example.com/api/auth/callback/email?token=abc',
      subject: "You've been invited to join the team",
      body: bodyOf('You have been invited to join as a team member.'),
      tenantNames: ['Acme Blog'],
    });

    expect(html).not.toContain('<!doctype html>');
  });

  it("threads the resolved tenant's hue into the rendered html", () => {
    const brand = resolveTenantEmailBrand({
      preset: PRESET_ID.CONSOLE,
      accentHue: 140,
    });

    const { html } = buildInviteMagicLinkEmail({
      url: 'https://example.com/api/auth/callback/email?token=abc',
      subject: "You've been invited to join the team",
      body: bodyOf('You have been invited to join as a team member.'),
      tenantNames: ['Acme Blog'],
      tenantIdentity: { brand, brandName: 'Acme Blog', tenantId: 'tenant-1' },
    });

    expect(html).toContain('<!doctype html>');
    expect(html).toContain(brand.logo1);
  });

  it('renders an uploaded logo and the footer postal address when given', () => {
    const brand = resolveTenantEmailBrand({
      preset: PRESET_ID.CONSOLE,
      accentHue: 140,
    });

    const { html } = buildInviteMagicLinkEmail({
      url: 'https://example.com/api/auth/callback/email?token=abc',
      subject: "You've been invited to join the team",
      body: bodyOf('You have been invited to join as a team member.'),
      tenantNames: ['Acme Blog'],
      tenantIdentity: { brand, brandName: 'Acme Blog', tenantId: 'tenant-1' },
      logoImageUrl: 'https://cdn.example.com/logo.png',
      footerPostalAddress: '123 Main St, Springfield',
    });

    expect(html).toContain('src="https://cdn.example.com/logo.png"');
    expect(html).toContain('123 Main St, Springfield');
  });

  it('keeps the accept-invite action outside the authored body even when the body mimics it', () => {
    const brand = resolveTenantEmailBrand({
      preset: PRESET_ID.CONSOLE,
      accentHue: 140,
    });
    const adversarialUrl = 'https://attacker.example.com/phish';

    const { html } = buildInviteMagicLinkEmail({
      url: 'https://example.com/api/auth/callback/email?token=abc',
      subject: "You've been invited to join the team",
      body: [
        {
          _type: 'block',
          _key: 'adversarial-1',
          style: 'normal',
          markDefs: [
            { _type: 'link', _key: 'adversarial-link', href: adversarialUrl },
          ],
          children: [
            {
              _type: 'span',
              _key: 'adversarial-span',
              text: 'Accept invite',
              marks: ['adversarial-link'],
            },
          ],
        },
      ],
      tenantNames: ['Acme Blog'],
      tenantIdentity: { brand, brandName: 'Acme Blog', tenantId: 'tenant-1' },
    });

    expect(html).toContain(
      'href="https://example.com/api/auth/callback/email?token=abc"',
    );
    expect(html).toContain(`href="${adversarialUrl}"`);
  });

  it('keeps the real invited organisation name intact even when the authored body impersonates a different one', () => {
    const brand = resolveTenantEmailBrand({
      preset: PRESET_ID.CONSOLE,
      accentHue: 140,
    });

    const { html } = buildInviteMagicLinkEmail({
      url: 'https://example.com/api/auth/callback/email?token=abc',
      subject: "You've been invited to join the team",
      body: bodyOf("You've been invited to manage EvilCorp."),
      tenantNames: ['Acme Blog'],
      tenantIdentity: { brand, brandName: 'Acme Blog', tenantId: 'tenant-1' },
    });

    expect(html).toContain('<strong>Acme Blog</strong>');
  });
});
