import { PRESET_ID, resolveTenantEmailBrand } from '@blog/config';

import { buildNewsletterConfirmationEmail } from './newsletter-confirmation-email';

const CONFIRMATION_URL = 'https://example.com/api/newsletter/confirm?token=abc';
const UNSUBSCRIBE_URL =
  'https://example.com/api/newsletter/unsubscribe?token=xyz';
const BRAND_NAME = 'Acme Blog';
const BRAND = resolveTenantEmailBrand({
  preset: PRESET_ID.CONSOLE,
  accentHue: 200,
});

describe(buildNewsletterConfirmationEmail, () => {
  it('builds a subject naming the confirmation', () => {
    const { subject } = buildNewsletterConfirmationEmail({
      confirmationUrl: CONFIRMATION_URL,
      unsubscribeUrl: UNSUBSCRIBE_URL,
      brand: BRAND,
      brandName: BRAND_NAME,
    });

    expect(subject).toBe('Confirm your subscription');
  });

  it('links the confirmation url in the html body', () => {
    const { html } = buildNewsletterConfirmationEmail({
      confirmationUrl: CONFIRMATION_URL,
      unsubscribeUrl: UNSUBSCRIBE_URL,
      brand: BRAND,
      brandName: BRAND_NAME,
    });

    expect(html).toContain(`href="${CONFIRMATION_URL}"`);
  });

  it('links the unsubscribe url in the html body', () => {
    const { html } = buildNewsletterConfirmationEmail({
      confirmationUrl: CONFIRMATION_URL,
      unsubscribeUrl: UNSUBSCRIBE_URL,
      brand: BRAND,
      brandName: BRAND_NAME,
    });

    expect(html).toContain(`href="${UNSUBSCRIBE_URL}"`);
  });

  it('sets List-Unsubscribe and List-Unsubscribe-Post headers', () => {
    const { headers } = buildNewsletterConfirmationEmail({
      confirmationUrl: CONFIRMATION_URL,
      unsubscribeUrl: UNSUBSCRIBE_URL,
      brand: BRAND,
      brandName: BRAND_NAME,
    });

    expect(headers).toEqual({
      'List-Unsubscribe': `<${UNSUBSCRIBE_URL}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    });
  });

  it("renders the subscribing tenant's resolved hue, not a fixed palette", () => {
    const otherTenantBrand = resolveTenantEmailBrand({
      preset: PRESET_ID.CONSOLE,
      accentHue: 40,
    });

    const { html } = buildNewsletterConfirmationEmail({
      confirmationUrl: CONFIRMATION_URL,
      unsubscribeUrl: UNSUBSCRIBE_URL,
      brand: otherTenantBrand,
      brandName: BRAND_NAME,
    });

    expect(html).toContain(otherTenantBrand.logo1);
    expect(html).not.toContain(BRAND.logo1);
  });

  it('renders the tenant brand name', () => {
    const { html } = buildNewsletterConfirmationEmail({
      confirmationUrl: CONFIRMATION_URL,
      unsubscribeUrl: UNSUBSCRIBE_URL,
      brand: BRAND,
      brandName: BRAND_NAME,
    });

    expect(html).toContain(BRAND_NAME);
  });
});
