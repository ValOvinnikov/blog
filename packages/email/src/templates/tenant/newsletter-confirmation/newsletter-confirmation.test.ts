import type { TTenantEmailBrand } from '@blog/email/html/tenant-shell/tenant-shell';
import type { TPortableTextContent } from '@blog/email/portable-text';
import {
  MOCK_LOGO_URL,
  MOCK_POSTAL_ADDRESS,
  MOCK_TENANT_NAME,
  MOCK_UNSAFE_MARKUP,
} from '@blog/email/testing/email-fixtures';
import { MOCK_TENANT_EMAIL_BRAND } from '@blog/email/testing/tenant-email-brand';

import { buildNewsletterConfirmationEmail } from './newsletter-confirmation';

const BODY_TEXT = 'Click the button below to confirm.';

const CONFIRMATION_URL = 'https://example.com/api/newsletter/confirm?token=abc';
const UNSUBSCRIBE_URL =
  'https://example.com/api/newsletter/unsubscribe?token=xyz&ref=email';
const SUBJECT = 'Confirm your newsletter subscription';
const BODY: TPortableTextContent = [
  {
    _type: 'block',
    style: 'normal',
    children: [{ _type: 'span', text: BODY_TEXT }],
  },
];

describe('buildNewsletterConfirmationEmail', () => {
  describe('with the default input', () => {
    let email: ReturnType<typeof buildNewsletterConfirmationEmail>;

    beforeEach(() => {
      email = buildNewsletterConfirmationEmail({
        subject: SUBJECT,
        body: BODY,
        confirmationUrl: CONFIRMATION_URL,
        unsubscribeUrl: UNSUBSCRIBE_URL,
        brand: MOCK_TENANT_EMAIL_BRAND,
        brandName: MOCK_TENANT_NAME,
      });
    });

    it('returns the given subject unchanged', () => {
      expect(email.subject).toBe(SUBJECT);
    });

    it('renders the authored body through the shared serializer', () => {
      expect(email.html).toContain(BODY_TEXT);
    });

    it('renders both the confirm and unsubscribe actions', () => {
      expect(email.html).toContain('>Confirm subscription</a>');
      expect(email.html).toContain('>Unsubscribe</a>');
    });

    it('sanitizes and escapes the unsubscribe url via the shared action helper', () => {
      expect(email.html).not.toContain(`href="${UNSUBSCRIBE_URL}"`);
      expect(email.html).toContain(
        `href="${UNSUBSCRIBE_URL.replace(/&/g, '&amp;')}"`,
      );
    });

    it('sets List-Unsubscribe and List-Unsubscribe-Post headers with raw, unescaped urls', () => {
      expect(email.headers).toEqual({
        'List-Unsubscribe': `<${UNSUBSCRIBE_URL}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      });
    });

    it('does not put either link in the authored body html', () => {
      const bodyEndMarker = 'Click the button below to confirm.</p>';
      const bodyEnd = email.html.indexOf(bodyEndMarker) + bodyEndMarker.length;
      const bodyOnlyHtml = email.html.slice(0, bodyEnd);

      expect(bodyOnlyHtml).not.toContain('<a href=');
    });

    it('renders the tenant brand name', () => {
      expect(email.html).toContain(MOCK_TENANT_NAME);
    });

    it('renders byte-identical html when logoImageUrl and footerPostalAddress are omitted vs explicitly undefined', () => {
      const { html: withUndefinedOptionals } = buildNewsletterConfirmationEmail(
        {
          subject: SUBJECT,
          body: BODY,
          confirmationUrl: CONFIRMATION_URL,
          unsubscribeUrl: UNSUBSCRIBE_URL,
          brand: MOCK_TENANT_EMAIL_BRAND,
          brandName: MOCK_TENANT_NAME,
          logoImageUrl: undefined,
          footerPostalAddress: undefined,
        },
      );

      expect(withUndefinedOptionals).toBe(email.html);
    });
  });

  it('escapes an authored body that attempts to inject markup', () => {
    const { html } = buildNewsletterConfirmationEmail({
      subject: SUBJECT,
      body: [
        {
          _type: 'block',
          style: 'normal',
          children: [{ _type: 'span', text: MOCK_UNSAFE_MARKUP }],
        },
      ],
      confirmationUrl: CONFIRMATION_URL,
      unsubscribeUrl: UNSUBSCRIBE_URL,
      brand: MOCK_TENANT_EMAIL_BRAND,
      brandName: MOCK_TENANT_NAME,
    });

    expect(html).not.toContain(MOCK_UNSAFE_MARKUP);
  });

  it('no authored body content can remove or duplicate the confirm/unsubscribe actions, even one that mimics them', () => {
    const impersonatingBody: TPortableTextContent = [
      {
        _type: 'block',
        style: 'normal',
        children: [
          {
            _type: 'span',
            text: `Confirm subscription ${CONFIRMATION_URL}`,
          },
        ],
      },
      {
        _type: 'unsupportedFutureBlock',
        label: 'Unsubscribe',
        url: 'https://evil.example/unsubscribe',
      },
    ];

    const { html } = buildNewsletterConfirmationEmail({
      subject: SUBJECT,
      body: impersonatingBody,
      confirmationUrl: CONFIRMATION_URL,
      unsubscribeUrl: UNSUBSCRIBE_URL,
      brand: MOCK_TENANT_EMAIL_BRAND,
      brandName: MOCK_TENANT_NAME,
    });

    expect(html).not.toContain('evil.example');
    expect(
      html.match(
        new RegExp(
          `href="${CONFIRMATION_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`,
          'g',
        ),
      ),
    ).toHaveLength(1);
    expect(
      html.match(
        new RegExp(
          `href="${UNSUBSCRIBE_URL.replace(/&/g, '&amp;').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`,
          'g',
        ),
      ),
    ).toHaveLength(1);
  });

  it("renders the subscribing tenant's resolved brand, not a fixed palette", () => {
    const otherBrand: TTenantEmailBrand = {
      ...MOCK_TENANT_EMAIL_BRAND,
      brandPrimarySolid: '#112233',
      brandPrimaryContrast: '#f0f0f0',
    };

    const { html } = buildNewsletterConfirmationEmail({
      subject: SUBJECT,
      body: BODY,
      confirmationUrl: CONFIRMATION_URL,
      unsubscribeUrl: UNSUBSCRIBE_URL,
      brand: otherBrand,
      brandName: MOCK_TENANT_NAME,
    });

    expect(html).toContain(otherBrand.brandPrimarySolid);
    expect(html).toContain(otherBrand.brandPrimaryContrast);
  });

  it('forwards a given logo URL and footer postal address to the shell', () => {
    const { html } = buildNewsletterConfirmationEmail({
      subject: SUBJECT,
      body: BODY,
      confirmationUrl: CONFIRMATION_URL,
      unsubscribeUrl: UNSUBSCRIBE_URL,
      brand: MOCK_TENANT_EMAIL_BRAND,
      brandName: MOCK_TENANT_NAME,
      logoImageUrl: MOCK_LOGO_URL,
      footerPostalAddress: MOCK_POSTAL_ADDRESS,
    });

    expect(html).toContain(`<img src="${MOCK_LOGO_URL}"`);
    expect(html).toContain(MOCK_POSTAL_ADDRESS);
  });
});
