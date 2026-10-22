import { EMAIL_TEMPLATE_TYPE, LOCALE_ISO_CODES } from '@blog/config';
import { DEFAULT_TENANT_ID } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

const { getEmailConfigMock, getEmailTemplateMock } = vi.hoisted(() => ({
  getEmailConfigMock: vi.fn(),
  getEmailTemplateMock: vi.fn(),
}));

const DEFAULT_COPY_SUBJECT = 'Confirm your newsletter subscription';
const FRENCH_DEFAULT_COPY_SUBJECT = 'Confirmez votre abonnement';
const DEFAULT_COPY_BODY = [
  { _type: 'block', _key: 'newsletter-confirmation-default-1' },
];

vi.mock('@blog/db', () => ({
  queries: {
    emailConfig: { getEmailConfig: getEmailConfigMock },
    emailTemplates: { getEmailTemplate: getEmailTemplateMock },
  },
  EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE: {
    EN: {
      NEWSLETTER_CONFIRMATION: {
        subject: DEFAULT_COPY_SUBJECT,
        body: DEFAULT_COPY_BODY,
      },
    },
    FR: {
      NEWSLETTER_CONFIRMATION: {
        subject: FRENCH_DEFAULT_COPY_SUBJECT,
        body: DEFAULT_COPY_BODY,
      },
    },
  },
}));

const DEFAULT_FROM_ADDRESS = 'Newsletter <onboarding@resend.dev>';
const AUTHORED_SUBJECT = 'Confirm your subscription';
const TENANT_LOGO_URL = 'https://cdn.example.com/tenant-logo.png';
const TEMPLATE_LOGO_URL = 'https://cdn.example.com/template-logo.png';
const SENDER_NAME = 'Zeta Times';
const REPLY_TO_ADDRESS = 'support@example.com';
const FOOTER_POSTAL_ADDRESS = '123 Main St, Springfield';
const AUTHORED_BODY: unknown[] = [];

describe('resolveNewsletterEmailSettings', () => {
  let resolveNewsletterEmailSettings: typeof import('./resolve-newsletter-email-settings').resolveNewsletterEmailSettings;

  beforeEach(async () => {
    getEmailConfigMock.mockReset();
    getEmailTemplateMock.mockReset();
    getEmailConfigMock.mockResolvedValue(undefined);
    getEmailTemplateMock.mockResolvedValue({
      tenantId: DEFAULT_TENANT_ID,
      templateType: EMAIL_TEMPLATE_TYPE.NEWSLETTER_CONFIRMATION,
      subject: AUTHORED_SUBJECT,
      body: AUTHORED_BODY,
      logoAssetUrl: undefined,
    });
    ({ resolveNewsletterEmailSettings } =
      await import('./resolve-newsletter-email-settings'));
  });

  it('returns product defaults when the tenant has no email_config row', async () => {
    const settings = await resolveNewsletterEmailSettings(
      DEFAULT_TENANT_ID,
      undefined,
      LOCALE_ISO_CODES.EN,
    );

    expect(settings).toEqual({
      subject: AUTHORED_SUBJECT,
      body: AUTHORED_BODY,
      logoImageUrl: undefined,
      footerPostalAddress: undefined,
      fromAddress: DEFAULT_FROM_ADDRESS,
      replyTo: undefined,
    });
  });

  it('reads the template in the given language', async () => {
    await resolveNewsletterEmailSettings(
      DEFAULT_TENANT_ID,
      undefined,
      LOCALE_ISO_CODES.FR,
    );

    expect(getEmailTemplateMock).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      EMAIL_TEMPLATE_TYPE.NEWSLETTER_CONFIRMATION,
      LOCALE_ISO_CODES.FR,
    );
  });

  it("leaves the language to the tenant's default when no language is given", async () => {
    await resolveNewsletterEmailSettings(
      DEFAULT_TENANT_ID,
      undefined,
      undefined,
    );

    expect(getEmailTemplateMock).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      EMAIL_TEMPLATE_TYPE.NEWSLETTER_CONFIRMATION,
      undefined,
    );
  });

  describe('with a tenant-level logo configured', () => {
    beforeEach(() => {
      getEmailConfigMock.mockResolvedValue({
        tenantId: DEFAULT_TENANT_ID,
        logoAssetUrl: TENANT_LOGO_URL,
        senderName: undefined,
        replyToAddress: undefined,
        footerPostalAddress: undefined,
      });
    });

    it('prefers the per-template logo over the tenant-level logo', async () => {
      getEmailTemplateMock.mockResolvedValue({
        tenantId: DEFAULT_TENANT_ID,
        templateType: EMAIL_TEMPLATE_TYPE.NEWSLETTER_CONFIRMATION,
        subject: AUTHORED_SUBJECT,
        body: [],
        logoAssetUrl: TEMPLATE_LOGO_URL,
      });
      const settings = await resolveNewsletterEmailSettings(
        DEFAULT_TENANT_ID,
        undefined,
        LOCALE_ISO_CODES.EN,
      );

      expect(settings.logoImageUrl).toBe(TEMPLATE_LOGO_URL);
    });

    it('falls back to the tenant-level logo when no per-template logo is set', async () => {
      const settings = await resolveNewsletterEmailSettings(
        DEFAULT_TENANT_ID,
        undefined,
        LOCALE_ISO_CODES.EN,
      );

      expect(settings.logoImageUrl).toBe(TENANT_LOGO_URL);
    });
  });

  it('overrides the display name while keeping the resolved address', async () => {
    getEmailConfigMock.mockResolvedValue({
      tenantId: DEFAULT_TENANT_ID,
      logoAssetUrl: undefined,
      senderName: SENDER_NAME,
      replyToAddress: undefined,
      footerPostalAddress: undefined,
    });
    const defaultAddress = await resolveNewsletterEmailSettings(
      DEFAULT_TENANT_ID,
      undefined,
      LOCALE_ISO_CODES.EN,
    );
    expect(defaultAddress.fromAddress).toBe(
      `${SENDER_NAME} <onboarding@resend.dev>`,
    );

    const configuredAddress = await resolveNewsletterEmailSettings(
      DEFAULT_TENANT_ID,
      'Newsletter <news@mail.example.com>',
      LOCALE_ISO_CODES.EN,
    );
    expect(configuredAddress.fromAddress).toBe(
      `${SENDER_NAME} <news@mail.example.com>`,
    );
  });

  it('strips line breaks from a stored sender name before it reaches the from header', async () => {
    getEmailConfigMock.mockResolvedValue({
      tenantId: DEFAULT_TENANT_ID,
      logoAssetUrl: undefined,
      senderName: 'Zeta\r\nBcc: attacker@example.com',
      replyToAddress: undefined,
      footerPostalAddress: undefined,
    });
    const settings = await resolveNewsletterEmailSettings(
      DEFAULT_TENANT_ID,
      undefined,
      LOCALE_ISO_CODES.EN,
    );

    expect(settings.fromAddress).toBe(
      'ZetaBcc: attacker@example.com <onboarding@resend.dev>',
    );
  });

  it('strips angle brackets from a stored sender name so it cannot inject a second address', async () => {
    getEmailConfigMock.mockResolvedValue({
      tenantId: DEFAULT_TENANT_ID,
      logoAssetUrl: undefined,
      senderName: 'Acme <evil@attacker.example>',
      replyToAddress: undefined,
      footerPostalAddress: undefined,
    });
    const settings = await resolveNewsletterEmailSettings(
      DEFAULT_TENANT_ID,
      undefined,
      LOCALE_ISO_CODES.EN,
    );

    expect(settings.fromAddress.match(/</g)).toHaveLength(1);
    expect(settings.fromAddress).toContain('<onboarding@resend.dev>');
  });

  it('falls back to the unmodified from address when the sender name is whitespace-only after sanitizing', async () => {
    getEmailConfigMock.mockResolvedValue({
      tenantId: DEFAULT_TENANT_ID,
      logoAssetUrl: undefined,
      senderName: '   ',
      replyToAddress: undefined,
      footerPostalAddress: undefined,
    });
    const settings = await resolveNewsletterEmailSettings(
      DEFAULT_TENANT_ID,
      undefined,
      LOCALE_ISO_CODES.EN,
    );

    expect(settings.fromAddress).toBe(DEFAULT_FROM_ADDRESS);
  });

  it('passes a well-formed reply-to address through', async () => {
    getEmailConfigMock.mockResolvedValue({
      tenantId: DEFAULT_TENANT_ID,
      logoAssetUrl: undefined,
      senderName: undefined,
      replyToAddress: REPLY_TO_ADDRESS,
      footerPostalAddress: undefined,
    });
    const settings = await resolveNewsletterEmailSettings(
      DEFAULT_TENANT_ID,
      undefined,
      LOCALE_ISO_CODES.EN,
    );

    expect(settings.replyTo).toBe(REPLY_TO_ADDRESS);
  });

  it('passes the footer postal address through', async () => {
    getEmailConfigMock.mockResolvedValue({
      tenantId: DEFAULT_TENANT_ID,
      logoAssetUrl: undefined,
      senderName: undefined,
      replyToAddress: undefined,
      footerPostalAddress: FOOTER_POSTAL_ADDRESS,
    });
    const settings = await resolveNewsletterEmailSettings(
      DEFAULT_TENANT_ID,
      undefined,
      LOCALE_ISO_CODES.EN,
    );

    expect(settings.footerPostalAddress).toBe(FOOTER_POSTAL_ADDRESS);
  });

  it('drops a malformed reply-to address and logs rather than passing it through', async () => {
    getEmailConfigMock.mockResolvedValue({
      tenantId: DEFAULT_TENANT_ID,
      logoAssetUrl: undefined,
      senderName: undefined,
      replyToAddress: 'not-an-address',
      footerPostalAddress: undefined,
    });
    const settings = await resolveNewsletterEmailSettings(
      DEFAULT_TENANT_ID,
      undefined,
      LOCALE_ISO_CODES.EN,
    );

    expect(settings.replyTo).toBeUndefined();
    expect(vi.mocked(logger.warn)).toHaveBeenCalledWith(
      'newsletter_email_settings.reply_to_invalid',
      { tenantId: DEFAULT_TENANT_ID },
    );
  });

  it('falls back to product defaults and logs when getEmailConfig rejects', async () => {
    getEmailConfigMock.mockRejectedValue(new Error('db down'));
    const settings = await resolveNewsletterEmailSettings(
      DEFAULT_TENANT_ID,
      undefined,
      LOCALE_ISO_CODES.EN,
    );

    expect(settings).toEqual({
      subject: AUTHORED_SUBJECT,
      body: AUTHORED_BODY,
      logoImageUrl: undefined,
      footerPostalAddress: undefined,
      fromAddress: DEFAULT_FROM_ADDRESS,
      replyTo: undefined,
    });
    expect(vi.mocked(logger.warn)).toHaveBeenCalledWith(
      'newsletter_email_settings.email_config_fetch_failed',
      { tenantId: DEFAULT_TENANT_ID, error: expect.any(Error) },
    );
  });

  it('falls back to product-default subject and body and logs when getEmailTemplate rejects', async () => {
    getEmailTemplateMock.mockRejectedValue(new Error('db down'));
    const settings = await resolveNewsletterEmailSettings(
      DEFAULT_TENANT_ID,
      undefined,
      LOCALE_ISO_CODES.EN,
    );

    expect(settings).toEqual({
      subject: DEFAULT_COPY_SUBJECT,
      body: DEFAULT_COPY_BODY,
      logoImageUrl: undefined,
      footerPostalAddress: undefined,
      fromAddress: DEFAULT_FROM_ADDRESS,
      replyTo: undefined,
    });
    expect(vi.mocked(logger.warn)).toHaveBeenCalledWith(
      'newsletter_email_settings.email_template_fetch_failed',
      { tenantId: DEFAULT_TENANT_ID, error: expect.any(Error) },
    );
  });

  it("falls back to the product default in the reader's language when getEmailTemplate rejects", async () => {
    getEmailTemplateMock.mockRejectedValue(new Error('db down'));
    const settings = await resolveNewsletterEmailSettings(
      DEFAULT_TENANT_ID,
      undefined,
      LOCALE_ISO_CODES.FR,
    );

    expect(settings.subject).toBe(FRENCH_DEFAULT_COPY_SUBJECT);
  });

  it('still uses the successfully-resolved per-template logo when getEmailConfig rejects', async () => {
    getEmailConfigMock.mockRejectedValue(new Error('db down'));
    getEmailTemplateMock.mockResolvedValue({
      tenantId: DEFAULT_TENANT_ID,
      templateType: EMAIL_TEMPLATE_TYPE.NEWSLETTER_CONFIRMATION,
      subject: AUTHORED_SUBJECT,
      body: AUTHORED_BODY,
      logoAssetUrl: TEMPLATE_LOGO_URL,
    });
    const settings = await resolveNewsletterEmailSettings(
      DEFAULT_TENANT_ID,
      undefined,
      LOCALE_ISO_CODES.EN,
    );

    expect(settings.logoImageUrl).toBe(TEMPLATE_LOGO_URL);
  });

  it('still uses the successfully-resolved email_config values when getEmailTemplate rejects', async () => {
    getEmailTemplateMock.mockRejectedValue(new Error('db down'));
    getEmailConfigMock.mockResolvedValue({
      tenantId: DEFAULT_TENANT_ID,
      logoAssetUrl: TENANT_LOGO_URL,
      senderName: SENDER_NAME,
      replyToAddress: REPLY_TO_ADDRESS,
      footerPostalAddress: FOOTER_POSTAL_ADDRESS,
    });
    const settings = await resolveNewsletterEmailSettings(
      DEFAULT_TENANT_ID,
      undefined,
      LOCALE_ISO_CODES.EN,
    );

    expect(settings).toEqual({
      subject: DEFAULT_COPY_SUBJECT,
      body: DEFAULT_COPY_BODY,
      logoImageUrl: TENANT_LOGO_URL,
      footerPostalAddress: FOOTER_POSTAL_ADDRESS,
      fromAddress: `${SENDER_NAME} <onboarding@resend.dev>`,
      replyTo: REPLY_TO_ADDRESS,
    });
  });
});
