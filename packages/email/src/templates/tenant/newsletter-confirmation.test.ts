import type { TTenantEmailBrand } from '@blog/email/html/tenant-shell';

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

describe('buildNewsletterConfirmationEmail', () => {
  it('names the confirmation in the subject', () => {
    const { subject } = buildNewsletterConfirmationEmail({
      confirmationUrl: CONFIRMATION_URL,
      unsubscribeUrl: UNSUBSCRIBE_URL,
      brand: BRAND,
      brandName: 'Acme Blog',
    });

    expect(subject).toBe('Confirm your subscription');
  });

  it('renders both the confirm and unsubscribe actions', () => {
    const { html } = buildNewsletterConfirmationEmail({
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
      confirmationUrl: CONFIRMATION_URL,
      unsubscribeUrl: UNSUBSCRIBE_URL,
      brand: BRAND,
      brandName: 'Acme Blog',
    });

    const bodyEndMarker = 'you can safely ignore this email.</p>';
    const bodyEnd = html.indexOf(bodyEndMarker) + bodyEndMarker.length;
    const bodyOnlyHtml = html.slice(0, bodyEnd);

    expect(bodyOnlyHtml).not.toContain('<a href=');
  });

  it("renders the subscribing tenant's resolved brand, not a fixed palette", () => {
    const otherBrand: TTenantEmailBrand = {
      ...BRAND,
      brandPrimarySolid: '#112233',
      brandPrimaryContrast: '#f0f0f0',
    };

    const { html } = buildNewsletterConfirmationEmail({
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
      confirmationUrl: CONFIRMATION_URL,
      unsubscribeUrl: UNSUBSCRIBE_URL,
      brand: BRAND,
      brandName: 'Acme Blog',
    });

    expect(html).toContain('Acme Blog');
  });
});
