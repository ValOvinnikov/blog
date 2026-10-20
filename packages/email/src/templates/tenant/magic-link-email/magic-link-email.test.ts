import { NEUTRAL_EMAIL_PALETTE } from '@blog/email/html/neutral-shell/neutral-shell';
import {
  PLATFORM_EMAIL_BRAND,
  PLATFORM_EMAIL_BRAND_NAME,
} from '@blog/email/html/platform-email-brand/platform-email-brand';
import type { TPortableTextContent } from '@blog/email/portable-text';
import { TENANT_EMAIL_BRAND as brand } from '@blog/email/testing/tenant-email-brand';

import { buildMagicLinkEmail } from './magic-link-email';

function bodyOf(text: string): TPortableTextContent {
  return [
    {
      _type: 'block',
      _key: 'body-1',
      style: 'normal',
      children: [{ _type: 'span', _key: 'body-1-span', text, marks: [] }],
    },
  ];
}

describe(buildMagicLinkEmail, () => {
  it('percent-encodes an unsafe url in the neutral fallback action', () => {
    const { html } = buildMagicLinkEmail({
      url: `https://example.com/callback?token="><img src=x onerror=alert(1)>`,
      subject: 'Sign in to your account',
      body: bodyOf('We received a request to sign in.'),
    });

    expect(html).not.toContain('"><img src=x onerror=alert(1)>');
    expect(html).toContain('%22%3E%3Cimg%20src=x%20onerror=alert(1)%3E');
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

    it('renders a styled document titled with the subject', () => {
      expect(email.html).toContain('<!doctype html>');
      expect(email.html).toContain(`<title>${email.subject}</title>`);
    });

    it('renders the action as a button in the achromatic neutral palette', () => {
      expect(email.html).toContain(
        `background-color:${NEUTRAL_EMAIL_PALETTE.brandPrimarySolid}`,
      );
    });

    it('names no brand in a header mark or a copyright line', () => {
      expect(email.html).not.toContain('<svg');
      expect(email.html).not.toContain('&copy;');
    });

    it('renders no operator branding', () => {
      expect(email.html).not.toContain('Tenant Alerts');
      expect(email.html).not.toContain(PLATFORM_EMAIL_BRAND.brandPrimarySolid);
    });
  });

  describe('sent by the platform without a tenant identity', () => {
    let email: ReturnType<typeof buildMagicLinkEmail>;

    beforeEach(() => {
      email = buildMagicLinkEmail({
        url: 'https://platform.example.com/api/auth/callback/email?token=abc',
        subject: 'Sign in to your account',
        body: bodyOf('We received a request to sign in.'),
        isSentByPlatform: true,
        logoImageUrl: 'https://cdn.example.com/logo.png',
      });
    });

    it('links the magic-link url in the sign-in action', () => {
      expect(email.html).toContain(
        'href="https://platform.example.com/api/auth/callback/email?token=abc"',
      );
    });

    it('renders the action as a button in the platform palette', () => {
      expect(email.html).toContain(
        `background-color:${PLATFORM_EMAIL_BRAND.brandPrimarySolid}`,
      );
    });

    it('shows the platform logo mark next to the platform name', () => {
      expect(email.html).toContain('<svg');
      expect(email.html).toContain(PLATFORM_EMAIL_BRAND.logo1);
      expect(email.html).toContain(
        `&copy; ${new Date().getFullYear()} ${PLATFORM_EMAIL_BRAND_NAME}`,
      );
    });

    it('never replaces the mark with an uploaded logo image', () => {
      expect(email.html).not.toContain('https://cdn.example.com/logo.png');
    });

    it('renders no operator branding', () => {
      expect(email.html).not.toContain('Tenant Alerts');
    });
  });

  describe('with a tenant identity', () => {
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
