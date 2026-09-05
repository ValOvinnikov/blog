import { resolveTenantEmailBrand } from '@blog/config';
import { PRESET_ID } from '@blog/config/constants';

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

  it('renders plain, unstyled html when no tenant identity is given', () => {
    const { html } = buildMagicLinkEmail({
      url: 'https://example.com/api/auth/callback/email?token=abc',
      host: 'example.com',
    });

    expect(html).not.toContain('<!doctype html>');
  });

  it("threads the resolved tenant's hue into the rendered html", () => {
    const brand = resolveTenantEmailBrand({
      preset: PRESET_ID.CONSOLE,
      accentHue: 140,
    });

    const { html } = buildMagicLinkEmail({
      url: 'https://example.com/api/auth/callback/email?token=abc',
      host: 'acme.example.com',
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

    const { html } = buildMagicLinkEmail({
      url: 'https://example.com/api/auth/callback/email?token=abc',
      host: 'acme.example.com',
      tenantIdentity: { brand, brandName: 'Acme Blog', tenantId: 'tenant-1' },
      logoImageUrl: 'https://cdn.example.com/logo.png',
      footerPostalAddress: '123 Main St, Springfield',
    });

    expect(html).toContain('src="https://cdn.example.com/logo.png"');
    expect(html).toContain('123 Main St, Springfield');
  });
});
