import { NEUTRAL_EMAIL_PALETTE } from '@blog/email/html/neutral-shell/neutral-shell';
import {
  PLATFORM_EMAIL_BRAND,
  PLATFORM_EMAIL_BRAND_NAME,
} from '@blog/email/html/platform-email-brand/platform-email-brand';
import {
  COPYRIGHT_ENTITY,
  DOCTYPE,
  MOCK_ATTACKER_URL,
  MOCK_ATTRIBUTE_BREAKOUT,
  MOCK_ESCAPED_UNSAFE_MARKUP,
  MOCK_LOGO_URL,
  MOCK_MAGIC_LINK_URL,
  MOCK_NOW,
  MOCK_PERCENT_ENCODED_ATTRIBUTE_BREAKOUT,
  MOCK_PLATFORM_MAGIC_LINK_URL,
  MOCK_POSTAL_ADDRESS,
  MOCK_TENANT_NAME,
  MOCK_UNSAFE_MARKUP,
  MOCK_URL,
  OPERATOR_BRAND_NAME,
} from '@blog/email/testing/email-fixtures';
import {
  mockLinkedPortableTextBody,
  mockPortableTextBody,
} from '@blog/email/testing/portable-text-fixtures';
import { MOCK_TENANT_EMAIL_BRAND } from '@blog/email/testing/tenant-email-brand';
import { faker } from '@faker-js/faker';

import { buildInviteMagicLinkEmail } from './magic-link-invite-email';

faker.seed(6026);

const MOCK_SUBJECT = faker.lorem.sentence();
const MOCK_BODY_TEXT = faker.lorem.sentence();
const MOCK_OTHER_TENANT_NAME = faker.lorem.words(2);
const MOCK_THIRD_TENANT_NAME = faker.lorem.words(2);
const MOCK_IMPERSONATED_TENANT_NAME = faker.lorem.words(2);
const MOCK_MIMIC_LABEL = faker.lorem.words(2);
const MOCK_INPUT = {
  url: MOCK_MAGIC_LINK_URL,
  subject: MOCK_SUBJECT,
  body: mockPortableTextBody(MOCK_BODY_TEXT),
  tenantNames: [MOCK_TENANT_NAME],
};
const MOCK_TENANT_IDENTITY = {
  brand: MOCK_TENANT_EMAIL_BRAND,
  brandName: MOCK_TENANT_NAME,
};

describe(buildInviteMagicLinkEmail, () => {
  it.each([
    [
      'two invited tenant names with "and"',
      [MOCK_TENANT_NAME, MOCK_OTHER_TENANT_NAME],
      `${MOCK_TENANT_NAME} and ${MOCK_OTHER_TENANT_NAME}`,
    ],
    [
      'three or more invited tenant names with an Oxford comma',
      [MOCK_TENANT_NAME, MOCK_OTHER_TENANT_NAME, MOCK_THIRD_TENANT_NAME],
      `${MOCK_TENANT_NAME}, ${MOCK_OTHER_TENANT_NAME}, and ${MOCK_THIRD_TENANT_NAME}`,
    ],
  ])('joins %s', (_name, tenantNames, expected) => {
    const { html } = buildInviteMagicLinkEmail({ ...MOCK_INPUT, tenantNames });

    expect(html).toContain(`<strong>${expected}</strong>`);
  });

  it('escapes an operator-entered tenant name', () => {
    const { html } = buildInviteMagicLinkEmail({
      ...MOCK_INPUT,
      tenantNames: [MOCK_UNSAFE_MARKUP],
    });

    expect(html).not.toContain(MOCK_UNSAFE_MARKUP);
    expect(html).toContain(`<strong>${MOCK_ESCAPED_UNSAFE_MARKUP}</strong>`);
  });

  it('omits the invited organisation but keeps the action with no tenant names', () => {
    const { html } = buildInviteMagicLinkEmail({
      ...MOCK_INPUT,
      tenantNames: undefined,
    });

    expect(html).not.toContain('<strong>');
    expect(html).toContain(`href="${MOCK_MAGIC_LINK_URL}"`);
  });

  it('percent-encodes an unsafe url in the neutral fallback action', () => {
    const { html } = buildInviteMagicLinkEmail({
      ...MOCK_INPUT,
      url: `${MOCK_URL}/callback?token=${MOCK_ATTRIBUTE_BREAKOUT}`,
    });

    expect(html).not.toContain(MOCK_ATTRIBUTE_BREAKOUT);
    expect(html).toContain(MOCK_PERCENT_ENCODED_ATTRIBUTE_BREAKOUT);
  });

  describe('for a single invited tenant without a tenant identity', () => {
    let email: ReturnType<typeof buildInviteMagicLinkEmail>;

    beforeEach(() => {
      email = buildInviteMagicLinkEmail(MOCK_INPUT);
    });

    it('passes the subject through unchanged', () => {
      expect(email.subject).toBe(MOCK_SUBJECT);
    });

    it('renders the authored body', () => {
      expect(email.html).toContain(MOCK_BODY_TEXT);
    });

    it('names the single invited tenant as the organisation', () => {
      expect(email.html).toContain(`<strong>${MOCK_TENANT_NAME}</strong>`);
    });

    it('links the magic-link url in the accept-invite action', () => {
      expect(email.html).toContain(`href="${MOCK_MAGIC_LINK_URL}"`);
    });

    it('renders a full HTML document titled with the subject', () => {
      expect(email.html).toContain(DOCTYPE);
      expect(email.html).toContain(`<title>${MOCK_SUBJECT}</title>`);
    });

    it('renders the action as a button in the achromatic neutral palette', () => {
      expect(email.html).toContain(
        `background-color:${NEUTRAL_EMAIL_PALETTE.brandPrimarySolid}`,
      );
    });

    it('names no brand in a header mark or a copyright line', () => {
      expect(email.html).not.toContain('<svg');
      expect(email.html).not.toContain(COPYRIGHT_ENTITY);
    });

    it('renders no operator branding', () => {
      expect(email.html).not.toContain(OPERATOR_BRAND_NAME);
      expect(email.html).not.toContain(PLATFORM_EMAIL_BRAND.brandPrimarySolid);
    });
  });

  describe('sent by the platform without a tenant identity', () => {
    let email: ReturnType<typeof buildInviteMagicLinkEmail>;

    beforeEach(() => {
      vi.useFakeTimers({ now: MOCK_NOW });
      email = buildInviteMagicLinkEmail({
        ...MOCK_INPUT,
        url: MOCK_PLATFORM_MAGIC_LINK_URL,
        isSentByPlatform: true,
        logoImageUrl: MOCK_LOGO_URL,
      });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('links the platform magic-link url in the accept-invite action', () => {
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
        `${COPYRIGHT_ENTITY} ${MOCK_NOW.getFullYear()} ${PLATFORM_EMAIL_BRAND_NAME}`,
      );
    });

    it('never replaces the mark with an uploaded logo image', () => {
      expect(email.html).not.toContain(MOCK_LOGO_URL);
    });
  });

  describe('with a tenant identity', () => {
    it("renders in the resolved tenant's palette", () => {
      const { html } = buildInviteMagicLinkEmail({
        ...MOCK_INPUT,
        tenantIdentity: MOCK_TENANT_IDENTITY,
      });

      expect(html).toContain(DOCTYPE);
      expect(html).toContain(MOCK_TENANT_EMAIL_BRAND.logo1);
    });

    it('renders an uploaded logo and the footer postal address when given', () => {
      const { html } = buildInviteMagicLinkEmail({
        ...MOCK_INPUT,
        tenantIdentity: MOCK_TENANT_IDENTITY,
        logoImageUrl: MOCK_LOGO_URL,
        footerPostalAddress: MOCK_POSTAL_ADDRESS,
      });

      expect(html).toContain(`src="${MOCK_LOGO_URL}"`);
      expect(html).toContain(MOCK_POSTAL_ADDRESS);
    });

    it('renders the accept-invite action after a body link that mimics it', () => {
      const { html } = buildInviteMagicLinkEmail({
        ...MOCK_INPUT,
        body: mockLinkedPortableTextBody(MOCK_MIMIC_LABEL, MOCK_ATTACKER_URL),
        tenantIdentity: MOCK_TENANT_IDENTITY,
      });

      const realActionIndex = html.indexOf(`href="${MOCK_MAGIC_LINK_URL}"`);
      const adversarialLinkIndex = html.indexOf(`href="${MOCK_ATTACKER_URL}"`);

      expect(adversarialLinkIndex).toBeGreaterThan(-1);
      expect(adversarialLinkIndex).toBeLessThan(realActionIndex);
    });

    it('keeps the invited organisation when the body names a different one', () => {
      const { html } = buildInviteMagicLinkEmail({
        ...MOCK_INPUT,
        body: mockPortableTextBody(
          `You've been invited to manage ${MOCK_IMPERSONATED_TENANT_NAME}.`,
        ),
        tenantIdentity: MOCK_TENANT_IDENTITY,
      });

      expect(html).toContain(`<strong>${MOCK_TENANT_NAME}</strong>`);
    });
  });
});
