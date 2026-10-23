import { NEUTRAL_EMAIL_PALETTE } from '@blog/email/html/neutral-shell/neutral-shell';
import {
  PLATFORM_EMAIL_BRAND,
  PLATFORM_EMAIL_BRAND_NAME,
} from '@blog/email/html/platform-email-brand/platform-email-brand';
import {
  MOCK_ATTACKER_URL,
  MOCK_ATTRIBUTE_BREAKOUT,
  MOCK_LOGO_URL,
  MOCK_MAGIC_LINK_URL,
  MOCK_PERCENT_ENCODED_ATTRIBUTE_BREAKOUT,
  MOCK_PLATFORM_MAGIC_LINK_URL,
  MOCK_POSTAL_ADDRESS,
  MOCK_TENANT_NAME,
} from '@blog/email/testing/email-fixtures';
import {
  mockLinkedPortableTextBody,
  mockPortableTextBody,
} from '@blog/email/testing/portable-text-fixtures';
import { MOCK_TENANT_EMAIL_BRAND } from '@blog/email/testing/tenant-email-brand';

import { buildMagicLinkEmail } from './magic-link-email';

const SUBJECT = 'Sign in to your account';
const BODY_TEXT = 'We received a request to sign in.';
const DOCTYPE = '<!doctype html>';
const OPERATOR_BRAND_NAME = 'Tenant Alerts';

describe(buildMagicLinkEmail, () => {
  it('percent-encodes an unsafe url in the neutral fallback action', () => {
    const { html } = buildMagicLinkEmail({
      url: `https://example.com/callback?token=${MOCK_ATTRIBUTE_BREAKOUT}`,
      subject: SUBJECT,
      body: mockPortableTextBody(BODY_TEXT),
    });

    expect(html).not.toContain(MOCK_ATTRIBUTE_BREAKOUT);
    expect(html).toContain(MOCK_PERCENT_ENCODED_ATTRIBUTE_BREAKOUT);
  });

  describe('without a tenant identity', () => {
    let email: ReturnType<typeof buildMagicLinkEmail>;

    beforeEach(() => {
      email = buildMagicLinkEmail({
        url: MOCK_MAGIC_LINK_URL,
        subject: SUBJECT,
        body: mockPortableTextBody(BODY_TEXT),
      });
    });

    it('passes the resolved subject through unchanged', () => {
      expect(email.subject).toBe(SUBJECT);
    });

    it('renders the resolved body through the shared Portable Text serializer', () => {
      expect(email.html).toContain(BODY_TEXT);
    });

    it('links the magic-link url in the sign-in action', () => {
      expect(email.html).toContain(`href="${MOCK_MAGIC_LINK_URL}"`);
      expect(email.html).toContain('Sign in');
    });

    it('renders a styled document titled with the subject', () => {
      expect(email.html).toContain(DOCTYPE);
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
      expect(email.html).not.toContain(OPERATOR_BRAND_NAME);
      expect(email.html).not.toContain(PLATFORM_EMAIL_BRAND.brandPrimarySolid);
    });
  });

  describe('sent by the platform without a tenant identity', () => {
    let email: ReturnType<typeof buildMagicLinkEmail>;

    beforeEach(() => {
      email = buildMagicLinkEmail({
        url: MOCK_PLATFORM_MAGIC_LINK_URL,
        subject: SUBJECT,
        body: mockPortableTextBody(BODY_TEXT),
        isSentByPlatform: true,
        logoImageUrl: MOCK_LOGO_URL,
      });
    });

    it('links the platform magic-link url in the sign-in action', () => {
      expect(email.html).toContain(`href="${MOCK_PLATFORM_MAGIC_LINK_URL}"`);
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
      expect(email.html).not.toContain(MOCK_LOGO_URL);
    });

    it('renders no operator branding beside the platform mark', () => {
      expect(email.html).not.toContain(OPERATOR_BRAND_NAME);
    });
  });

  describe('with a tenant identity', () => {
    it("threads the resolved tenant's hue into the rendered html", () => {
      const { html } = buildMagicLinkEmail({
        url: MOCK_MAGIC_LINK_URL,
        subject: SUBJECT,
        body: mockPortableTextBody(BODY_TEXT),
        tenantIdentity: {
          brand: MOCK_TENANT_EMAIL_BRAND,
          brandName: MOCK_TENANT_NAME,
        },
      });

      expect(html).toContain(DOCTYPE);
      expect(html).toContain(MOCK_TENANT_EMAIL_BRAND.logo1);
    });

    it('renders an uploaded logo and the footer postal address when given', () => {
      const { html } = buildMagicLinkEmail({
        url: MOCK_MAGIC_LINK_URL,
        subject: SUBJECT,
        body: mockPortableTextBody(BODY_TEXT),
        tenantIdentity: {
          brand: MOCK_TENANT_EMAIL_BRAND,
          brandName: MOCK_TENANT_NAME,
        },
        logoImageUrl: MOCK_LOGO_URL,
        footerPostalAddress: MOCK_POSTAL_ADDRESS,
      });

      expect(html).toContain(`src="${MOCK_LOGO_URL}"`);
      expect(html).toContain(MOCK_POSTAL_ADDRESS);
    });

    it('keeps the sign-in action outside the authored body even when the body mimics it', () => {
      const { html } = buildMagicLinkEmail({
        url: MOCK_MAGIC_LINK_URL,
        subject: SUBJECT,
        body: mockLinkedPortableTextBody('Sign in', MOCK_ATTACKER_URL),
        tenantIdentity: {
          brand: MOCK_TENANT_EMAIL_BRAND,
          brandName: MOCK_TENANT_NAME,
        },
      });

      expect(html).toContain(`href="${MOCK_MAGIC_LINK_URL}"`);
      expect(html).toContain(`href="${MOCK_ATTACKER_URL}"`);

      const realActionIndex = html.indexOf(`href="${MOCK_MAGIC_LINK_URL}"`);
      const adversarialLinkIndex = html.indexOf(`href="${MOCK_ATTACKER_URL}"`);
      expect(adversarialLinkIndex).toBeLessThan(realActionIndex);
    });
  });
});
