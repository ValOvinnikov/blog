import { getLocale } from 'next-intl/server';
import type { MockInstance } from 'vitest';

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

const getLocaleMock = vi.mocked(getLocale);

const TENANT_ID = 'tenant-1';
const DEFAULT_FROM_ADDRESS = 'Newsletter <onboarding@resend.dev>';
const AUTHORED_SUBJECT = 'Confirm your subscription';
const AUTHORED_BODY: unknown[] = [];

describe('resolveNewsletterEmailSettings', () => {
  let resolveNewsletterEmailSettings: typeof import('./resolve-newsletter-email-settings').resolveNewsletterEmailSettings;

  beforeEach(async () => {
    getLocaleMock.mockResolvedValue('EN');
    getEmailConfigMock.mockReset();
    getEmailTemplateMock.mockReset();
    getEmailConfigMock.mockResolvedValue(undefined);
    getEmailTemplateMock.mockResolvedValue({
      tenantId: TENANT_ID,
      templateType: 'NEWSLETTER_CONFIRMATION',
      subject: AUTHORED_SUBJECT,
      body: AUTHORED_BODY,
      logoAssetUrl: undefined,
    });
    ({ resolveNewsletterEmailSettings } =
      await import('./resolve-newsletter-email-settings'));
  });

  it('returns product defaults when the tenant has no email_config row', async () => {
    const settings = await resolveNewsletterEmailSettings(TENANT_ID, undefined);

    expect(settings).toEqual({
      subject: AUTHORED_SUBJECT,
      body: AUTHORED_BODY,
      logoImageUrl: undefined,
      footerPostalAddress: undefined,
      fromAddress: DEFAULT_FROM_ADDRESS,
      replyTo: undefined,
    });
  });

  it('reads the template in the language of the page the reader subscribed on', async () => {
    getLocaleMock.mockResolvedValue('FR');

    await resolveNewsletterEmailSettings(TENANT_ID, undefined);

    expect(getEmailTemplateMock).toHaveBeenCalledWith(
      TENANT_ID,
      'NEWSLETTER_CONFIRMATION',
      'FR',
    );
  });

  it("leaves the language to the tenant's default when the page language is not a site language", async () => {
    getLocaleMock.mockResolvedValue('xx');

    await resolveNewsletterEmailSettings(TENANT_ID, undefined);

    expect(getEmailTemplateMock).toHaveBeenCalledWith(
      TENANT_ID,
      'NEWSLETTER_CONFIRMATION',
      undefined,
    );
  });

  describe('with a tenant-level logo configured', () => {
    beforeEach(() => {
      getEmailConfigMock.mockResolvedValue({
        tenantId: TENANT_ID,
        logoAssetUrl: 'https://cdn.example.com/tenant-logo.png',
        senderName: undefined,
        replyToAddress: undefined,
        footerPostalAddress: undefined,
      });
    });

    it('prefers the per-template logo over the tenant-level logo', async () => {
      getEmailTemplateMock.mockResolvedValue({
        tenantId: TENANT_ID,
        templateType: 'NEWSLETTER_CONFIRMATION',
        subject: 'Confirm your subscription',
        body: [],
        logoAssetUrl: 'https://cdn.example.com/template-logo.png',
      });
      const settings = await resolveNewsletterEmailSettings(
        TENANT_ID,
        undefined,
      );

      expect(settings.logoImageUrl).toBe(
        'https://cdn.example.com/template-logo.png',
      );
    });

    it('falls back to the tenant-level logo when no per-template logo is set', async () => {
      const settings = await resolveNewsletterEmailSettings(
        TENANT_ID,
        undefined,
      );

      expect(settings.logoImageUrl).toBe(
        'https://cdn.example.com/tenant-logo.png',
      );
    });
  });

  it('overrides the display name while keeping the resolved address', async () => {
    getEmailConfigMock.mockResolvedValue({
      tenantId: TENANT_ID,
      logoAssetUrl: undefined,
      senderName: 'Zeta Times',
      replyToAddress: undefined,
      footerPostalAddress: undefined,
    });
    const defaultAddress = await resolveNewsletterEmailSettings(
      TENANT_ID,
      undefined,
    );
    expect(defaultAddress.fromAddress).toBe(
      'Zeta Times <onboarding@resend.dev>',
    );

    const configuredAddress = await resolveNewsletterEmailSettings(
      TENANT_ID,
      'Newsletter <news@mail.example.com>',
    );
    expect(configuredAddress.fromAddress).toBe(
      'Zeta Times <news@mail.example.com>',
    );
  });

  it('strips line breaks from a stored sender name before it reaches the from header', async () => {
    getEmailConfigMock.mockResolvedValue({
      tenantId: TENANT_ID,
      logoAssetUrl: undefined,
      senderName: 'Zeta\r\nBcc: attacker@example.com',
      replyToAddress: undefined,
      footerPostalAddress: undefined,
    });
    const settings = await resolveNewsletterEmailSettings(TENANT_ID, undefined);

    expect(settings.fromAddress).toBe(
      'ZetaBcc: attacker@example.com <onboarding@resend.dev>',
    );
  });

  it('strips angle brackets from a stored sender name so it cannot inject a second address', async () => {
    getEmailConfigMock.mockResolvedValue({
      tenantId: TENANT_ID,
      logoAssetUrl: undefined,
      senderName: 'Acme <evil@attacker.example>',
      replyToAddress: undefined,
      footerPostalAddress: undefined,
    });
    const settings = await resolveNewsletterEmailSettings(TENANT_ID, undefined);

    expect(settings.fromAddress.match(/</g)).toHaveLength(1);
    expect(settings.fromAddress).toContain('<onboarding@resend.dev>');
  });

  it('falls back to the unmodified from address when the sender name is whitespace-only after sanitizing', async () => {
    getEmailConfigMock.mockResolvedValue({
      tenantId: TENANT_ID,
      logoAssetUrl: undefined,
      senderName: '   ',
      replyToAddress: undefined,
      footerPostalAddress: undefined,
    });
    const settings = await resolveNewsletterEmailSettings(TENANT_ID, undefined);

    expect(settings.fromAddress).toBe(DEFAULT_FROM_ADDRESS);
  });

  it('passes a well-formed reply-to address through', async () => {
    getEmailConfigMock.mockResolvedValue({
      tenantId: TENANT_ID,
      logoAssetUrl: undefined,
      senderName: undefined,
      replyToAddress: 'support@example.com',
      footerPostalAddress: undefined,
    });
    const settings = await resolveNewsletterEmailSettings(TENANT_ID, undefined);

    expect(settings.replyTo).toBe('support@example.com');
  });

  it('passes the footer postal address through', async () => {
    getEmailConfigMock.mockResolvedValue({
      tenantId: TENANT_ID,
      logoAssetUrl: undefined,
      senderName: undefined,
      replyToAddress: undefined,
      footerPostalAddress: '123 Main St, Springfield',
    });
    const settings = await resolveNewsletterEmailSettings(TENANT_ID, undefined);

    expect(settings.footerPostalAddress).toBe('123 Main St, Springfield');
  });

  describe('when console warnings are expected', () => {
    let warnSpy: MockInstance<typeof console.warn>;

    beforeEach(() => {
      warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      warnSpy.mockRestore();
    });

    it('drops a malformed reply-to address and logs rather than passing it through', async () => {
      getEmailConfigMock.mockResolvedValue({
        tenantId: TENANT_ID,
        logoAssetUrl: undefined,
        senderName: undefined,
        replyToAddress: 'not-an-address',
        footerPostalAddress: undefined,
      });
      const settings = await resolveNewsletterEmailSettings(
        TENANT_ID,
        undefined,
      );

      expect(settings.replyTo).toBeUndefined();
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('newsletter_email_settings.reply_to_invalid'),
      );
    });

    it('falls back to product defaults and logs when getEmailConfig rejects', async () => {
      getEmailConfigMock.mockRejectedValue(new Error('db down'));
      const settings = await resolveNewsletterEmailSettings(
        TENANT_ID,
        undefined,
      );

      expect(settings).toEqual({
        subject: AUTHORED_SUBJECT,
        body: AUTHORED_BODY,
        logoImageUrl: undefined,
        footerPostalAddress: undefined,
        fromAddress: DEFAULT_FROM_ADDRESS,
        replyTo: undefined,
      });
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'newsletter_email_settings.email_config_fetch_failed',
        ),
      );
    });

    it('falls back to product-default subject and body and logs when getEmailTemplate rejects', async () => {
      getEmailTemplateMock.mockRejectedValue(new Error('db down'));
      const settings = await resolveNewsletterEmailSettings(
        TENANT_ID,
        undefined,
      );

      expect(settings).toEqual({
        subject: DEFAULT_COPY_SUBJECT,
        body: DEFAULT_COPY_BODY,
        logoImageUrl: undefined,
        footerPostalAddress: undefined,
        fromAddress: DEFAULT_FROM_ADDRESS,
        replyTo: undefined,
      });
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'newsletter_email_settings.email_template_fetch_failed',
        ),
      );
    });

    it("falls back to the product default in the reader's language when getEmailTemplate rejects", async () => {
      getLocaleMock.mockResolvedValue('FR');
      getEmailTemplateMock.mockRejectedValue(new Error('db down'));
      const settings = await resolveNewsletterEmailSettings(
        TENANT_ID,
        undefined,
      );

      expect(settings.subject).toBe(FRENCH_DEFAULT_COPY_SUBJECT);
    });

    it('still uses the successfully-resolved per-template logo when getEmailConfig rejects', async () => {
      getEmailConfigMock.mockRejectedValue(new Error('db down'));
      getEmailTemplateMock.mockResolvedValue({
        tenantId: TENANT_ID,
        templateType: 'NEWSLETTER_CONFIRMATION',
        subject: AUTHORED_SUBJECT,
        body: AUTHORED_BODY,
        logoAssetUrl: 'https://cdn.example.com/template-logo.png',
      });
      const settings = await resolveNewsletterEmailSettings(
        TENANT_ID,
        undefined,
      );

      expect(settings.logoImageUrl).toBe(
        'https://cdn.example.com/template-logo.png',
      );
    });

    it('still uses the successfully-resolved email_config values when getEmailTemplate rejects', async () => {
      getEmailTemplateMock.mockRejectedValue(new Error('db down'));
      getEmailConfigMock.mockResolvedValue({
        tenantId: TENANT_ID,
        logoAssetUrl: 'https://cdn.example.com/tenant-logo.png',
        senderName: 'Zeta Times',
        replyToAddress: 'support@example.com',
        footerPostalAddress: '123 Main St, Springfield',
      });
      const settings = await resolveNewsletterEmailSettings(
        TENANT_ID,
        undefined,
      );

      expect(settings).toEqual({
        subject: DEFAULT_COPY_SUBJECT,
        body: DEFAULT_COPY_BODY,
        logoImageUrl: 'https://cdn.example.com/tenant-logo.png',
        footerPostalAddress: '123 Main St, Springfield',
        fromAddress: 'Zeta Times <onboarding@resend.dev>',
        replyTo: 'support@example.com',
      });
    });
  });
});
