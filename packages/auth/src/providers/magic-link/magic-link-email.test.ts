import { resolveTenantEmailBrand } from '@blog/config';
import { PRESET_ID } from '@blog/config/constants';
import type { TPortableTextContent } from '@blog/email';

import { buildMagicLinkEmail } from './magic-link-email';

const bodyOf = (text: string): TPortableTextContent => [
  {
    _type: 'block',
    _key: 'body-1',
    style: 'normal',
    children: [{ _type: 'span', _key: 'body-1-span', text, marks: [] }],
  },
];

describe(buildMagicLinkEmail, () => {
  it('escapes an unsafe url in the unbranded fallback link', () => {
    const { html } = buildMagicLinkEmail({
      url: `https://example.com/callback?token="><img src=x onerror=alert(1)>`,
      subject: 'Sign in to your account',
      body: bodyOf('We received a request to sign in.'),
    });

    expect(html).not.toContain('"><img src=x onerror=alert(1)>');
    expect(html).toContain('&quot;&gt;&lt;img src=x onerror=alert(1)&gt;');
  });

  describe('without a tenant identity', () => {
    let email: ReturnType<typeof buildMagicLinkEmail>;

    beforeEach(() => {
      email = buildMagicLinkEmail({
        url: 'https://example.com/api/auth/callback/email?token=abc',
        subject: 'Sign in to your account',
        body: bodyOf('We received a request to sign in.'),
      });
    });

    it('passes the resolved subject through unchanged', () => {
      expect(email.subject).toBe('Sign in to your account');
    });

    it('renders the resolved body through the shared Portable Text serializer', () => {
      expect(email.html).toContain('We received a request to sign in.');
    });

    it('links the magic-link url in the sign-in action', () => {
      expect(email.html).toContain(
        'href="https://example.com/api/auth/callback/email?token=abc"',
      );
      expect(email.html).toContain('Sign in');
    });

    it('renders plain, unstyled html when no tenant identity is given', () => {
      expect(email.html).not.toContain('<!doctype html>');
    });
  });

  describe('with a tenant identity', () => {
    let brand: ReturnType<typeof resolveTenantEmailBrand>;

    beforeEach(() => {
      brand = resolveTenantEmailBrand({
        preset: PRESET_ID.CONSOLE,
        accentHue: 140,
      });
    });

    it("threads the resolved tenant's hue into the rendered html", () => {
      const { html } = buildMagicLinkEmail({
        url: 'https://example.com/api/auth/callback/email?token=abc',
        subject: 'Sign in to your account',
        body: bodyOf('We received a request to sign in.'),
        tenantIdentity: { brand, brandName: 'Acme Blog' },
      });

      expect(html).toContain('<!doctype html>');
      expect(html).toContain(brand.logo1);
    });

    it('renders an uploaded logo and the footer postal address when given', () => {
      const { html } = buildMagicLinkEmail({
        url: 'https://example.com/api/auth/callback/email?token=abc',
        subject: 'Sign in to your account',
        body: bodyOf('We received a request to sign in.'),
        tenantIdentity: { brand, brandName: 'Acme Blog' },
        logoImageUrl: 'https://cdn.example.com/logo.png',
        footerPostalAddress: '123 Main St, Springfield',
      });

      expect(html).toContain('src="https://cdn.example.com/logo.png"');
      expect(html).toContain('123 Main St, Springfield');
    });

    it('keeps the sign-in action outside the authored body even when the body mimics it', () => {
      const adversarialUrl = 'https://attacker.example.com/phish';

      const { html } = buildMagicLinkEmail({
        url: 'https://example.com/api/auth/callback/email?token=abc',
        subject: 'Sign in to your account',
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
                text: 'Sign in',
                marks: ['adversarial-link'],
              },
            ],
          },
        ],
        tenantIdentity: { brand, brandName: 'Acme Blog' },
      });

      expect(html).toContain(
        'href="https://example.com/api/auth/callback/email?token=abc"',
      );
      expect(html).toContain(`href="${adversarialUrl}"`);

      const realActionIndex = html.indexOf(
        'href="https://example.com/api/auth/callback/email?token=abc"',
      );
      const adversarialLinkIndex = html.indexOf(`href="${adversarialUrl}"`);
      expect(adversarialLinkIndex).toBeLessThan(realActionIndex);
    });
  });
});
