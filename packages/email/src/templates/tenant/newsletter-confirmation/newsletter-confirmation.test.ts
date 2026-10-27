import type { TTenantEmailBrand } from '@blog/email/html/tenant-shell/tenant-shell';
import type { TPortableTextContent } from '@blog/email/portable-text';
import {
  MOCK_LOGO_URL,
  MOCK_POSTAL_ADDRESS,
  MOCK_TENANT_NAME,
  MOCK_UNSAFE_MARKUP,
  MOCK_URL,
} from '@blog/email/testing/email-fixtures';
import { mockPortableTextBody } from '@blog/email/testing/portable-text-fixtures';
import { MOCK_TENANT_EMAIL_BRAND } from '@blog/email/testing/tenant-email-brand';
import { faker } from '@faker-js/faker';

import {
  buildNewsletterConfirmationEmail,
  LIST_UNSUBSCRIBE_ONE_CLICK,
} from './newsletter-confirmation';

faker.seed(6026);

const MOCK_SUBJECT = faker.lorem.sentence();
const MOCK_BODY_TEXT = faker.lorem.sentence();
const MOCK_CONFIRMATION_URL = `${MOCK_URL}/api/newsletter/confirm?token=${faker.string.alphanumeric(12)}`;
const MOCK_UNSUBSCRIBE_URL = `${MOCK_URL}/api/newsletter/unsubscribe?token=${faker.string.alphanumeric(12)}&ref=email`;
const MOCK_ESCAPED_UNSUBSCRIBE_URL = MOCK_UNSUBSCRIBE_URL.replace(
  /&/g,
  '&amp;',
);
const MOCK_ATTACKER_HOST = 'evil.example';
const MOCK_SOLID_COLOUR = faker.color.rgb();
const MOCK_CONTRAST_COLOUR = faker.color.rgb();

const MOCK_INPUT = {
  subject: MOCK_SUBJECT,
  body: mockPortableTextBody(MOCK_BODY_TEXT),
  confirmationUrl: MOCK_CONFIRMATION_URL,
  unsubscribeUrl: MOCK_UNSUBSCRIBE_URL,
  brand: MOCK_TENANT_EMAIL_BRAND,
  brandName: MOCK_TENANT_NAME,
};

function countOccurrences(html: string, fragment: string): number {
  return html.split(fragment).length - 1;
}

describe(buildNewsletterConfirmationEmail, () => {
  describe('for a pending subscription', () => {
    let email: ReturnType<typeof buildNewsletterConfirmationEmail>;

    beforeEach(() => {
      email = buildNewsletterConfirmationEmail(MOCK_INPUT);
    });

    it('passes the subject through unchanged', () => {
      expect(email.subject).toBe(MOCK_SUBJECT);
    });

    it('renders the authored body', () => {
      expect(email.html).toContain(MOCK_BODY_TEXT);
    });

    it('links the confirmation url', () => {
      expect(email.html).toContain(`href="${MOCK_CONFIRMATION_URL}"`);
    });

    it('links the unsubscribe url escaped', () => {
      expect(email.html).not.toContain(`href="${MOCK_UNSUBSCRIBE_URL}"`);
      expect(email.html).toContain(`href="${MOCK_ESCAPED_UNSUBSCRIBE_URL}"`);
    });

    it('sets one-click List-Unsubscribe headers with the raw url', () => {
      expect(email.headers).toEqual({
        'List-Unsubscribe': `<${MOCK_UNSUBSCRIBE_URL}>`,
        'List-Unsubscribe-Post': LIST_UNSUBSCRIBE_ONE_CLICK,
      });
    });

    it('renders no link inside the authored body', () => {
      const bodyEndMarker = `${MOCK_BODY_TEXT}</p>`;
      const bodyEnd = email.html.indexOf(bodyEndMarker) + bodyEndMarker.length;
      const bodyOnlyHtml = email.html.slice(0, bodyEnd);

      expect(bodyOnlyHtml).not.toContain('<a href=');
    });

    it('renders the tenant brand name', () => {
      expect(email.html).toContain(MOCK_TENANT_NAME);
    });

    it('renders the same email for undefined logo and address as for none', () => {
      const { html: withUndefinedOptionals } = buildNewsletterConfirmationEmail(
        {
          ...MOCK_INPUT,
          logoImageUrl: undefined,
          footerPostalAddress: undefined,
        },
      );

      expect(withUndefinedOptionals).toBe(email.html);
    });
  });

  it('escapes an authored body that attempts to inject markup', () => {
    const { html } = buildNewsletterConfirmationEmail({
      ...MOCK_INPUT,
      body: mockPortableTextBody(MOCK_UNSAFE_MARKUP),
    });

    expect(html).not.toContain(MOCK_UNSAFE_MARKUP);
  });

  it('renders each action exactly once whatever the authored body mimics', () => {
    const impersonatingBody: TPortableTextContent = [
      ...mockPortableTextBody(`Confirm subscription ${MOCK_CONFIRMATION_URL}`),
      {
        _type: 'unsupportedFutureBlock',
        label: 'Unsubscribe',
        url: `https://${MOCK_ATTACKER_HOST}/unsubscribe`,
      },
    ];

    const { html } = buildNewsletterConfirmationEmail({
      ...MOCK_INPUT,
      body: impersonatingBody,
    });

    expect(html).not.toContain(MOCK_ATTACKER_HOST);
    expect(countOccurrences(html, `href="${MOCK_CONFIRMATION_URL}"`)).toBe(1);
    expect(
      countOccurrences(html, `href="${MOCK_ESCAPED_UNSUBSCRIBE_URL}"`),
    ).toBe(1);
  });

  it("renders the subscribing tenant's resolved palette", () => {
    const otherBrand: TTenantEmailBrand = {
      ...MOCK_TENANT_EMAIL_BRAND,
      brandPrimarySolid: MOCK_SOLID_COLOUR,
      brandPrimaryContrast: MOCK_CONTRAST_COLOUR,
    };

    const { html } = buildNewsletterConfirmationEmail({
      ...MOCK_INPUT,
      brand: otherBrand,
    });

    expect(html).toContain(MOCK_SOLID_COLOUR);
    expect(html).toContain(MOCK_CONTRAST_COLOUR);
  });

  it('renders a given logo and footer postal address', () => {
    const { html } = buildNewsletterConfirmationEmail({
      ...MOCK_INPUT,
      logoImageUrl: MOCK_LOGO_URL,
      footerPostalAddress: MOCK_POSTAL_ADDRESS,
    });

    expect(html).toContain(`<img src="${MOCK_LOGO_URL}"`);
    expect(html).toContain(MOCK_POSTAL_ADDRESS);
  });
});
