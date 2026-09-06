import type { TTenantEmailBrand } from '@blog/email/html/tenant-shell';
import type { TPortableTextContent } from '@blog/email/portable-text';

import { buildNewsletterConfirmationEmail } from './newsletter-confirmation';

const BRAND: TTenantEmailBrand = {
  surface: '#ffffff',
  surface2: '#f8f8fb',
  border: '#e4e4ec',
  text: '#1f1f2b',
  textMuted: '#6b6b7a',
  brandPrimary: '#3355dd',
  brandPrimarySolid: '#2244cc',
  brandPrimaryContrast: '#ffffff',
  logo1: '#3355dd',
  logo2: '#5577ee',
  logo3: '#88aaff',
};

const CONFIRMATION_URL = 'https://example.com/api/newsletter/confirm?token=abc';
const UNSUBSCRIBE_URL =
  'https://example.com/api/newsletter/unsubscribe?token=xyz&ref=email';
const SUBJECT = 'Confirm your newsletter subscription';
const BODY: TPortableTextContent = [
  {
    _type: 'block',
    style: 'normal',
    children: [{ _type: 'span', text: 'Click the button below to confirm.' }],
  },
];

describe('buildNewsletterConfirmationEmail', () => {
  it('returns the given subject unchanged', () => {
    const { subject } = buildNewsletterConfirmationEmail({
      subject: SUBJECT,
      body: BODY,
      confirmationUrl: CONFIRMATION_URL,
      unsubscribeUrl: UNSUBSCRIBE_URL,
      brand: BRAND,
      brandName: 'Acme Blog',
    });

    expect(subject).toBe(SUBJECT);
  });

  it('renders the authored body through the shared serializer', () => {
    const { html } = buildNewsletterConfirmationEmail({
      subject: SUBJECT,
      body: BODY,
      confirmationUrl: CONFIRMATION_URL,
      unsubscribeUrl: UNSUBSCRIBE_URL,
      brand: BRAND,
      brandName: 'Acme Blog',
    });

    expect(html).toContain('Click the button below to confirm.');
  });

  it('escapes an authored body that attempts to inject markup', () => {
    const { html } = buildNewsletterConfirmationEmail({
      subject: SUBJECT,
      body: [
        {
          _type: 'block',
          style: 'normal',
          children: [{ _type: 'span', text: '<img src=x onerror=steal()>' }],
        },
      ],
      confirmationUrl: CONFIRMATION_URL,
      unsubscribeUrl: UNSUBSCRIBE_URL,
      brand: BRAND,
      brandName: 'Acme Blog',
    });

    expect(html).not.toContain('<img src=x onerror=steal()>');
  });

  it('renders both the confirm and unsubscribe actions', () => {
    const { html } = buildNewsletterConfirmationEmail({
      subject: SUBJECT,
      body: BODY,
      confirmationUrl: CONFIRMATION_URL,
      unsubscribeUrl: UNSUBSCRIBE_URL,
      brand: BRAND,
      brandName: 'Acme Blog',
    });

    expect(html).toContain('>Confirm subscription</a>');
    expect(html).toContain('>Unsubscribe</a>');
  });

  it('sanitizes and escapes the unsubscribe url via the shared action helper', () => {
    const { html } = buildNewsletterConfirmationEmail({
      subject: SUBJECT,
      body: BODY,
      confirmationUrl: CONFIRMATION_URL,
      unsubscribeUrl: UNSUBSCRIBE_URL,
      brand: BRAND,
      brandName: 'Acme Blog',
    });

    expect(html).not.toContain(`href="${UNSUBSCRIBE_URL}"`);
    expect(html).toContain(`href="${UNSUBSCRIBE_URL.replace(/&/g, '&amp;')}"`);
  });

  it('sets List-Unsubscribe and List-Unsubscribe-Post headers with raw, unescaped urls', () => {
    const { headers } = buildNewsletterConfirmationEmail({
      subject: SUBJECT,
      body: BODY,
      confirmationUrl: CONFIRMATION_URL,
      unsubscribeUrl: UNSUBSCRIBE_URL,
      brand: BRAND,
      brandName: 'Acme Blog',
    });

    expect(headers).toEqual({
      'List-Unsubscribe': `<${UNSUBSCRIBE_URL}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    });
  });

  it('does not put either link in the authored body html', () => {
    const { html } = buildNewsletterConfirmationEmail({
      subject: SUBJECT,
      body: BODY,
      confirmationUrl: CONFIRMATION_URL,
      unsubscribeUrl: UNSUBSCRIBE_URL,
      brand: BRAND,
      brandName: 'Acme Blog',
    });

    const bodyEndMarker = 'Click the button below to confirm.</p>';
    const bodyEnd = html.indexOf(bodyEndMarker) + bodyEndMarker.length;
    const bodyOnlyHtml = html.slice(0, bodyEnd);

    expect(bodyOnlyHtml).not.toContain('<a href=');
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
      brand: BRAND,
      brandName: 'Acme Blog',
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
      ...BRAND,
      brandPrimarySolid: '#112233',
      brandPrimaryContrast: '#f0f0f0',
    };

    const { html } = buildNewsletterConfirmationEmail({
      subject: SUBJECT,
      body: BODY,
      confirmationUrl: CONFIRMATION_URL,
      unsubscribeUrl: UNSUBSCRIBE_URL,
      brand: otherBrand,
      brandName: 'Acme Blog',
    });

    expect(html).toContain(otherBrand.brandPrimarySolid);
    expect(html).toContain(otherBrand.brandPrimaryContrast);
  });

  it('renders the tenant brand name', () => {
    const { html } = buildNewsletterConfirmationEmail({
      subject: SUBJECT,
      body: BODY,
      confirmationUrl: CONFIRMATION_URL,
      unsubscribeUrl: UNSUBSCRIBE_URL,
      brand: BRAND,
      brandName: 'Acme Blog',
    });

    expect(html).toContain('Acme Blog');
  });

  it('renders byte-identical html when logoImageUrl and footerPostalAddress are omitted vs explicitly undefined', () => {
    const { html: withoutOptionals } = buildNewsletterConfirmationEmail({
      subject: SUBJECT,
      body: BODY,
      confirmationUrl: CONFIRMATION_URL,
      unsubscribeUrl: UNSUBSCRIBE_URL,
      brand: BRAND,
      brandName: 'Acme Blog',
    });
    const { html: withUndefinedOptionals } = buildNewsletterConfirmationEmail({
      subject: SUBJECT,
      body: BODY,
      confirmationUrl: CONFIRMATION_URL,
      unsubscribeUrl: UNSUBSCRIBE_URL,
      brand: BRAND,
      brandName: 'Acme Blog',
      logoImageUrl: undefined,
      footerPostalAddress: undefined,
    });

    expect(withUndefinedOptionals).toBe(withoutOptionals);
  });

  it('forwards a given logo URL and footer postal address to the shell', () => {
    const { html } = buildNewsletterConfirmationEmail({
      subject: SUBJECT,
      body: BODY,
      confirmationUrl: CONFIRMATION_URL,
      unsubscribeUrl: UNSUBSCRIBE_URL,
      brand: BRAND,
      brandName: 'Acme Blog',
      logoImageUrl: 'https://cdn.example.com/logo.png',
      footerPostalAddress: '123 Main St, Springfield',
    });

    expect(html).toContain('<img src="https://cdn.example.com/logo.png"');
    expect(html).toContain('123 Main St, Springfield');
  });
});
