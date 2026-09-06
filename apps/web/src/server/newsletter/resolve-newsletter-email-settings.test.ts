const { getEmailConfigMock, getEmailTemplateMock } = vi.hoisted(() => ({
  getEmailConfigMock: vi.fn(),
  getEmailTemplateMock: vi.fn(),
}));

vi.mock('@blog/db', () => ({
  queries: {
    emailConfig: { getEmailConfig: getEmailConfigMock },
    emailTemplates: { getEmailTemplate: getEmailTemplateMock },
  },
}));

const TENANT_ID = 'tenant-1';
const DEFAULT_FROM_ADDRESS = 'Newsletter <onboarding@resend.dev>';

describe('resolveNewsletterEmailSettings', () => {
  beforeEach(() => {
    getEmailConfigMock.mockReset();
    getEmailTemplateMock.mockReset();
    getEmailConfigMock.mockResolvedValue(undefined);
    getEmailTemplateMock.mockResolvedValue({
      tenantId: TENANT_ID,
      templateType: 'NEWSLETTER_CONFIRMATION',
      subject: 'Confirm your subscription',
      body: [],
      logoAssetUrl: undefined,
    });
  });

  it('returns product defaults when the tenant has no email_config row', async () => {
    const { resolveNewsletterEmailSettings } =
      await import('./resolve-newsletter-email-settings');

    const settings = await resolveNewsletterEmailSettings(TENANT_ID, undefined);

    expect(settings).toEqual({
      logoImageUrl: undefined,
      footerPostalAddress: undefined,
      fromAddress: DEFAULT_FROM_ADDRESS,
      replyTo: undefined,
    });
  });

  it('prefers the per-template logo over the tenant-level logo', async () => {
    getEmailConfigMock.mockResolvedValue({
      tenantId: TENANT_ID,
      logoAssetUrl: 'https://cdn.example.com/tenant-logo.png',
      senderName: undefined,
      replyToAddress: undefined,
      footerPostalAddress: undefined,
    });
    getEmailTemplateMock.mockResolvedValue({
      tenantId: TENANT_ID,
      templateType: 'NEWSLETTER_CONFIRMATION',
      subject: 'Confirm your subscription',
      body: [],
      logoAssetUrl: 'https://cdn.example.com/template-logo.png',
    });
    const { resolveNewsletterEmailSettings } =
      await import('./resolve-newsletter-email-settings');

    const settings = await resolveNewsletterEmailSettings(TENANT_ID, undefined);

    expect(settings.logoImageUrl).toBe(
      'https://cdn.example.com/template-logo.png',
    );
  });

  it('falls back to the tenant-level logo when no per-template logo is set', async () => {
    getEmailConfigMock.mockResolvedValue({
      tenantId: TENANT_ID,
      logoAssetUrl: 'https://cdn.example.com/tenant-logo.png',
      senderName: undefined,
      replyToAddress: undefined,
      footerPostalAddress: undefined,
    });
    const { resolveNewsletterEmailSettings } =
      await import('./resolve-newsletter-email-settings');

    const settings = await resolveNewsletterEmailSettings(TENANT_ID, undefined);

    expect(settings.logoImageUrl).toBe(
      'https://cdn.example.com/tenant-logo.png',
    );
  });

  it('overrides the display name while keeping the resolved address', async () => {
    getEmailConfigMock.mockResolvedValue({
      tenantId: TENANT_ID,
      logoAssetUrl: undefined,
      senderName: 'Zeta Times',
      replyToAddress: undefined,
      footerPostalAddress: undefined,
    });
    const { resolveNewsletterEmailSettings } =
      await import('./resolve-newsletter-email-settings');

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
    const { resolveNewsletterEmailSettings } =
      await import('./resolve-newsletter-email-settings');

    const settings = await resolveNewsletterEmailSettings(TENANT_ID, undefined);

    expect(settings.fromAddress).toBe(
      'Zeta Bcc: attacker@example.com <onboarding@resend.dev>',
    );
  });

  it('passes a well-formed reply-to address through', async () => {
    getEmailConfigMock.mockResolvedValue({
      tenantId: TENANT_ID,
      logoAssetUrl: undefined,
      senderName: undefined,
      replyToAddress: 'support@example.com',
      footerPostalAddress: undefined,
    });
    const { resolveNewsletterEmailSettings } =
      await import('./resolve-newsletter-email-settings');

    const settings = await resolveNewsletterEmailSettings(TENANT_ID, undefined);

    expect(settings.replyTo).toBe('support@example.com');
  });

  it('drops a malformed reply-to address and logs rather than passing it through', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    getEmailConfigMock.mockResolvedValue({
      tenantId: TENANT_ID,
      logoAssetUrl: undefined,
      senderName: undefined,
      replyToAddress: 'not-an-address',
      footerPostalAddress: undefined,
    });
    const { resolveNewsletterEmailSettings } =
      await import('./resolve-newsletter-email-settings');

    const settings = await resolveNewsletterEmailSettings(TENANT_ID, undefined);

    expect(settings.replyTo).toBeUndefined();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('newsletter_email_settings.reply_to_invalid'),
    );
    warnSpy.mockRestore();
  });

  it('passes the footer postal address through', async () => {
    getEmailConfigMock.mockResolvedValue({
      tenantId: TENANT_ID,
      logoAssetUrl: undefined,
      senderName: undefined,
      replyToAddress: undefined,
      footerPostalAddress: '123 Main St, Springfield',
    });
    const { resolveNewsletterEmailSettings } =
      await import('./resolve-newsletter-email-settings');

    const settings = await resolveNewsletterEmailSettings(TENANT_ID, undefined);

    expect(settings.footerPostalAddress).toBe('123 Main St, Springfield');
  });

  it('falls back to product defaults and logs when getEmailConfig rejects', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    getEmailConfigMock.mockRejectedValue(new Error('db down'));
    const { resolveNewsletterEmailSettings } =
      await import('./resolve-newsletter-email-settings');

    const settings = await resolveNewsletterEmailSettings(TENANT_ID, undefined);

    expect(settings).toEqual({
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
    warnSpy.mockRestore();
  });

  it('falls back to product defaults and logs when getEmailTemplate rejects', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    getEmailTemplateMock.mockRejectedValue(new Error('db down'));
    const { resolveNewsletterEmailSettings } =
      await import('./resolve-newsletter-email-settings');

    const settings = await resolveNewsletterEmailSettings(TENANT_ID, undefined);

    expect(settings).toEqual({
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
    warnSpy.mockRestore();
  });

  it('still uses the successfully-resolved per-template logo when getEmailConfig rejects', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    getEmailConfigMock.mockRejectedValue(new Error('db down'));
    getEmailTemplateMock.mockResolvedValue({
      tenantId: TENANT_ID,
      templateType: 'NEWSLETTER_CONFIRMATION',
      subject: 'Confirm your subscription',
      body: [],
      logoAssetUrl: 'https://cdn.example.com/template-logo.png',
    });
    const { resolveNewsletterEmailSettings } =
      await import('./resolve-newsletter-email-settings');

    const settings = await resolveNewsletterEmailSettings(TENANT_ID, undefined);

    expect(settings.logoImageUrl).toBe(
      'https://cdn.example.com/template-logo.png',
    );
    warnSpy.mockRestore();
  });

  it('still uses the successfully-resolved email_config values when getEmailTemplate rejects', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    getEmailTemplateMock.mockRejectedValue(new Error('db down'));
    getEmailConfigMock.mockResolvedValue({
      tenantId: TENANT_ID,
      logoAssetUrl: 'https://cdn.example.com/tenant-logo.png',
      senderName: 'Zeta Times',
      replyToAddress: 'support@example.com',
      footerPostalAddress: '123 Main St, Springfield',
    });
    const { resolveNewsletterEmailSettings } =
      await import('./resolve-newsletter-email-settings');

    const settings = await resolveNewsletterEmailSettings(TENANT_ID, undefined);

    expect(settings).toEqual({
      logoImageUrl: 'https://cdn.example.com/tenant-logo.png',
      footerPostalAddress: '123 Main St, Springfield',
      fromAddress: 'Zeta Times <onboarding@resend.dev>',
      replyTo: 'support@example.com',
    });
    warnSpy.mockRestore();
  });
});
