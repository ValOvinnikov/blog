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
  MOCK_SCRIPT_MARKUP,
  MOCK_TENANT_NAME,
} from '@blog/email/testing/email-fixtures';
import {
  mockLinkedPortableTextBody,
  mockPortableTextBody,
} from '@blog/email/testing/portable-text-fixtures';
import { MOCK_TENANT_EMAIL_BRAND } from '@blog/email/testing/tenant-email-brand';

import { buildInviteMagicLinkEmail } from './magic-link-invite-email';

const SUBJECT = "You've been invited to join the team";
const BODY_TEXT = 'You have been invited to join as a team member.';
const OTHER_TENANT_NAME = 'Other Corp';
const ACTION_LABEL = 'Accept invite';
const DOCTYPE = '<!doctype html>';

describe(buildInviteMagicLinkEmail, () => {
  it('joins two invited tenant names with "and"', () => {
    const { html } = buildInviteMagicLinkEmail({
      url: MOCK_MAGIC_LINK_URL,
      subject: SUBJECT,
      body: mockPortableTextBody(BODY_TEXT),
      tenantNames: [MOCK_TENANT_NAME, OTHER_TENANT_NAME],
    });

    expect(html).toContain(
      `<strong>${MOCK_TENANT_NAME} and Other Corp</strong>`,
    );
  });

  it('joins three or more invited tenant names with an Oxford comma', () => {
    const { html } = buildInviteMagicLinkEmail({
      url: MOCK_MAGIC_LINK_URL,
      subject: SUBJECT,
      body: mockPortableTextBody(BODY_TEXT),
      tenantNames: [MOCK_TENANT_NAME, OTHER_TENANT_NAME, 'Third Co'],
    });

    expect(html).toContain(
      `<strong>${MOCK_TENANT_NAME}, Other Corp, and Third Co</strong>`,
    );
  });

  it('escapes HTML-unsafe characters in an operator-entered tenant name', () => {
    const { html } = buildInviteMagicLinkEmail({
      url: MOCK_MAGIC_LINK_URL,
      subject: SUBJECT,
      body: mockPortableTextBody(BODY_TEXT),
      tenantNames: [`<script>alert(1)</script> & "quoted" 'name'`],
    });

    expect(html).not.toContain(MOCK_SCRIPT_MARKUP);
    expect(html).toContain(
      '&lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;quoted&quot; &#39;name&#39;',
    );
  });

  it('omits the organisation element and still sends when no tenant names are given', () => {
    const { html } = buildInviteMagicLinkEmail({
      url: MOCK_MAGIC_LINK_URL,
      subject: SUBJECT,
      body: mockPortableTextBody(BODY_TEXT),
    });

    expect(html).not.toContain("You've been invited to manage");
    expect(html).toContain(`href="${MOCK_MAGIC_LINK_URL}"`);
  });

  it('percent-encodes an unsafe url in the neutral fallback action', () => {
    const { html } = buildInviteMagicLinkEmail({
      url: `https://example.com/callback?token=${MOCK_ATTRIBUTE_BREAKOUT}`,
      subject: SUBJECT,
      body: mockPortableTextBody(BODY_TEXT),
      tenantNames: [MOCK_TENANT_NAME],
    });

    expect(html).not.toContain(MOCK_ATTRIBUTE_BREAKOUT);
    expect(html).toContain(MOCK_PERCENT_ENCODED_ATTRIBUTE_BREAKOUT);
  });

  describe('for a single invited tenant without a tenant identity', () => {
    let email: ReturnType<typeof buildInviteMagicLinkEmail>;

    beforeEach(() => {
      email = buildInviteMagicLinkEmail({
        url: MOCK_MAGIC_LINK_URL,
        subject: SUBJECT,
        body: mockPortableTextBody(BODY_TEXT),
        tenantNames: [MOCK_TENANT_NAME],
      });
    });

    it('passes the resolved subject through unchanged', () => {
      expect(email.subject).toBe(SUBJECT);
    });

    it('renders the resolved body through the shared Portable Text serializer', () => {
      expect(email.html).toContain(BODY_TEXT);
    });

    it('names a single invited tenant in the structural organisation element', () => {
      expect(email.html).toContain(`<strong>${MOCK_TENANT_NAME}</strong>`);
    });

    it('links the magic-link url in the accept-invite action', () => {
      expect(email.html).toContain(`href="${MOCK_MAGIC_LINK_URL}"`);
      expect(email.html).toContain(ACTION_LABEL);
    });

    it('renders a styled document titled with the subject', () => {
      expect(email.html).toContain(DOCTYPE);
      expect(email.html).toContain(
        '<title>You&#39;ve been invited to join the team</title>',
      );
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
    let email: ReturnType<typeof buildInviteMagicLinkEmail>;

    beforeEach(() => {
      email = buildInviteMagicLinkEmail({
        url: MOCK_PLATFORM_MAGIC_LINK_URL,
        subject: SUBJECT,
        body: mockPortableTextBody(BODY_TEXT),
        tenantNames: ['<b>Acme</b> Blog'],
        isSentByPlatform: true,
        logoImageUrl: MOCK_LOGO_URL,
      });
    });

    it('links the platform magic-link url in the accept-invite action', () => {
      expect(email.html).toContain(`href="${MOCK_PLATFORM_MAGIC_LINK_URL}"`);
    });

    it('names the invited tenant, escaped, in the structural organisation element', () => {
      expect(email.html).not.toContain('<b>Acme</b>');
      expect(email.html).toContain(
        '<strong>&lt;b&gt;Acme&lt;/b&gt; Blog</strong>',
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
      expect(email.html).not.toContain(MOCK_LOGO_URL);
    });
  });

  describe('with a tenant identity', () => {
    it("threads the resolved tenant's hue into the rendered html", () => {
      const { html } = buildInviteMagicLinkEmail({
        url: MOCK_MAGIC_LINK_URL,
        subject: SUBJECT,
        body: mockPortableTextBody(BODY_TEXT),
        tenantNames: [MOCK_TENANT_NAME],
        tenantIdentity: {
          brand: MOCK_TENANT_EMAIL_BRAND,
          brandName: MOCK_TENANT_NAME,
        },
      });

      expect(html).toContain(DOCTYPE);
      expect(html).toContain(MOCK_TENANT_EMAIL_BRAND.logo1);
    });

    it('renders an uploaded logo and the footer postal address when given', () => {
      const { html } = buildInviteMagicLinkEmail({
        url: MOCK_MAGIC_LINK_URL,
        subject: SUBJECT,
        body: mockPortableTextBody(BODY_TEXT),
        tenantNames: [MOCK_TENANT_NAME],
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

    it('keeps the accept-invite action outside the authored body even when the body mimics it', () => {
      const { html } = buildInviteMagicLinkEmail({
        url: MOCK_MAGIC_LINK_URL,
        subject: SUBJECT,
        body: mockLinkedPortableTextBody(ACTION_LABEL, MOCK_ATTACKER_URL),
        tenantNames: [MOCK_TENANT_NAME],
        tenantIdentity: {
          brand: MOCK_TENANT_EMAIL_BRAND,
          brandName: MOCK_TENANT_NAME,
        },
      });

      expect(html).toContain(`href="${MOCK_MAGIC_LINK_URL}"`);
      expect(html).toContain(`href="${MOCK_ATTACKER_URL}"`);
    });

    it('keeps the real invited organisation name intact even when the authored body impersonates a different one', () => {
      const { html } = buildInviteMagicLinkEmail({
        url: MOCK_MAGIC_LINK_URL,
        subject: SUBJECT,
        body: mockPortableTextBody("You've been invited to manage EvilCorp."),
        tenantNames: [MOCK_TENANT_NAME],
        tenantIdentity: {
          brand: MOCK_TENANT_EMAIL_BRAND,
          brandName: MOCK_TENANT_NAME,
        },
      });

      expect(html).toContain(`<strong>${MOCK_TENANT_NAME}</strong>`);
    });
  });
});
