import {
  EMAIL_TEMPLATE_TYPE,
  LOCALE_ISO_CODES,
  type TLocaleIsoCode,
  type TMaybeUndefined,
} from '@blog/config';
import {
  MOCK_AUTHORED_SUBJECT,
  mockEmailConfig,
  mockEmailTemplate,
} from '@web/testing/server/newsletter/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';
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

const DEFAULT_ADDRESS = 'onboarding@resend.dev';
const DEFAULT_FROM_ADDRESS = `Newsletter <${DEFAULT_ADDRESS}>`;
const TENANT_LOGO_URL = 'https://cdn.example.com/tenant-logo.png';
const TEMPLATE_LOGO_URL = 'https://cdn.example.com/template-logo.png';
const SENDER_NAME = 'Zeta Times';
const REPLY_TO_ADDRESS = 'support@example.com';
const FOOTER_POSTAL_ADDRESS = '123 Main St, Springfield';
const AUTHORED_BODY: unknown[] = [];

const DEFAULT_SETTINGS = {
  subject: MOCK_AUTHORED_SUBJECT,
  body: AUTHORED_BODY,
  logoImageUrl: undefined,
  footerPostalAddress: undefined,
  fromAddress: DEFAULT_FROM_ADDRESS,
  replyTo: undefined,
};

describe('resolveNewsletterEmailSettings', () => {
  let resolveNewsletterEmailSettings: typeof import('./resolve-newsletter-email-settings').resolveNewsletterEmailSettings;

  const resolve = (
    locale: TMaybeUndefined<TLocaleIsoCode> = LOCALE_ISO_CODES.EN,
    configuredFromAddress?: string,
  ) =>
    resolveNewsletterEmailSettings(
      MOCK_TENANT_ID,
      configuredFromAddress,
      locale,
    );

  beforeEach(async () => {
    getEmailConfigMock.mockReset();
    getEmailTemplateMock.mockReset();
    getEmailConfigMock.mockResolvedValue(undefined);
    getEmailTemplateMock.mockResolvedValue(mockEmailTemplate());
    ({ resolveNewsletterEmailSettings } =
      await import('./resolve-newsletter-email-settings'));
  });

  it('returns product defaults when the tenant has no email_config row', async () => {
    await expect(resolve()).resolves.toEqual(DEFAULT_SETTINGS);
  });

  it.each([
    ['the given language', LOCALE_ISO_CODES.FR],
    ["the tenant's default language when none is given", undefined],
  ])('reads the template in %s', async (_, locale) => {
    await resolveNewsletterEmailSettings(MOCK_TENANT_ID, undefined, locale);

    expect(getEmailTemplateMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      EMAIL_TEMPLATE_TYPE.NEWSLETTER_CONFIRMATION,
      locale,
    );
  });

  it.each([
    ['the per-template logo when set', TEMPLATE_LOGO_URL, TEMPLATE_LOGO_URL],
    ['the tenant-level logo otherwise', undefined, TENANT_LOGO_URL],
  ])('uses %s', async (_, templateLogo, expected) => {
    getEmailConfigMock.mockResolvedValue(
      mockEmailConfig({ logoAssetUrl: TENANT_LOGO_URL }),
    );
    getEmailTemplateMock.mockResolvedValue(
      mockEmailTemplate({ logoAssetUrl: templateLogo }),
    );

    const { logoImageUrl } = await resolve();

    expect(logoImageUrl).toBe(expected);
  });

  it.each([
    ['a sender name', SENDER_NAME, `${SENDER_NAME} <${DEFAULT_ADDRESS}>`],
    [
      'line breaks in a sender name',
      'Zeta\r\nBcc: attacker@example.com',
      `ZetaBcc: attacker@example.com <${DEFAULT_ADDRESS}>`,
    ],
    [
      'angle brackets in a sender name',
      'Acme <evil@attacker.example>',
      `Acme evil@attacker.example <${DEFAULT_ADDRESS}>`,
    ],
    ['a sender name left empty by sanitizing', '   ', DEFAULT_FROM_ADDRESS],
  ])('applies %s to the from header', async (_, senderName, expected) => {
    getEmailConfigMock.mockResolvedValue(mockEmailConfig({ senderName }));

    const { fromAddress } = await resolve();

    expect(fromAddress).toBe(expected);
  });

  it('keeps the configured address when overriding the display name', async () => {
    getEmailConfigMock.mockResolvedValue(
      mockEmailConfig({ senderName: SENDER_NAME }),
    );

    const { fromAddress } = await resolve(
      LOCALE_ISO_CODES.EN,
      'Newsletter <news@mail.example.com>',
    );

    expect(fromAddress).toBe(`${SENDER_NAME} <news@mail.example.com>`);
  });

  it.each([
    [
      'a well-formed reply-to address',
      { replyToAddress: REPLY_TO_ADDRESS },
      { replyTo: REPLY_TO_ADDRESS },
    ],
    [
      'the footer postal address',
      { footerPostalAddress: FOOTER_POSTAL_ADDRESS },
      { footerPostalAddress: FOOTER_POSTAL_ADDRESS },
    ],
  ])('passes %s through', async (_, config, expected) => {
    getEmailConfigMock.mockResolvedValue(mockEmailConfig(config));

    await expect(resolve()).resolves.toEqual({
      ...DEFAULT_SETTINGS,
      ...expected,
    });
  });

  it('drops a malformed reply-to address and logs it', async () => {
    getEmailConfigMock.mockResolvedValue(
      mockEmailConfig({ replyToAddress: 'not-an-address' }),
    );

    const { replyTo } = await resolve();

    expect(replyTo).toBeUndefined();
    expect(vi.mocked(logger.warn)).toHaveBeenCalledWith(
      'newsletter_email_settings.reply_to_invalid',
      { tenantId: MOCK_TENANT_ID },
    );
  });

  it('falls back to product defaults and logs when the email config read fails', async () => {
    getEmailConfigMock.mockRejectedValue(MOCK_ERROR);

    await expect(resolve()).resolves.toEqual(DEFAULT_SETTINGS);
    expect(vi.mocked(logger.warn)).toHaveBeenCalledWith(
      'newsletter_email_settings.email_config_fetch_failed',
      { tenantId: MOCK_TENANT_ID, error: MOCK_ERROR },
    );
  });

  it.each([
    [LOCALE_ISO_CODES.EN, DEFAULT_COPY_SUBJECT],
    [LOCALE_ISO_CODES.FR, FRENCH_DEFAULT_COPY_SUBJECT],
  ])(
    'falls back to the %s default copy and logs when the template read fails',
    async (locale, subject) => {
      getEmailTemplateMock.mockRejectedValue(MOCK_ERROR);

      await expect(resolve(locale)).resolves.toEqual({
        ...DEFAULT_SETTINGS,
        subject,
        body: DEFAULT_COPY_BODY,
      });
      expect(vi.mocked(logger.warn)).toHaveBeenCalledWith(
        'newsletter_email_settings.email_template_fetch_failed',
        { tenantId: MOCK_TENANT_ID, error: MOCK_ERROR },
      );
    },
  );

  it('keeps the per-template logo when the email config read fails', async () => {
    getEmailConfigMock.mockRejectedValue(MOCK_ERROR);
    getEmailTemplateMock.mockResolvedValue(
      mockEmailTemplate({ logoAssetUrl: TEMPLATE_LOGO_URL }),
    );

    const { logoImageUrl } = await resolve();

    expect(logoImageUrl).toBe(TEMPLATE_LOGO_URL);
  });

  it('keeps the email config values when the template read fails', async () => {
    getEmailTemplateMock.mockRejectedValue(MOCK_ERROR);
    getEmailConfigMock.mockResolvedValue(
      mockEmailConfig({
        logoAssetUrl: TENANT_LOGO_URL,
        senderName: SENDER_NAME,
        replyToAddress: REPLY_TO_ADDRESS,
        footerPostalAddress: FOOTER_POSTAL_ADDRESS,
      }),
    );

    await expect(resolve()).resolves.toEqual({
      subject: DEFAULT_COPY_SUBJECT,
      body: DEFAULT_COPY_BODY,
      logoImageUrl: TENANT_LOGO_URL,
      footerPostalAddress: FOOTER_POSTAL_ADDRESS,
      fromAddress: `${SENDER_NAME} <${DEFAULT_ADDRESS}>`,
      replyTo: REPLY_TO_ADDRESS,
    });
  });
});
