import {
  EMAIL_TEMPLATE_TYPE,
  LOCALE_ISO_CODES,
  type TLocaleIsoCode,
  type TMaybeUndefined,
} from '@blog/config';
import { EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE } from '@blog/db/constants';
import { faker } from '@faker-js/faker';
import {
  mockEmailConfig,
  mockEmailTemplate,
} from '@web/testing/server/newsletter/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { resolveNewsletterEmailSettings } from './resolve-newsletter-email-settings';

const { getEmailConfigMock, getEmailTemplateMock } = vi.hoisted(() => ({
  getEmailConfigMock: vi.fn(),
  getEmailTemplateMock: vi.fn(),
}));

vi.mock('@blog/db', async () => ({
  ...(await import('@blog/db/constants')),
  queries: {
    emailConfig: { getEmailConfig: getEmailConfigMock },
    emailTemplates: { getEmailTemplate: getEmailTemplateMock },
  },
}));

faker.seed(5802);

const EMAIL_CONFIG_FETCH_FAILED_EVENT =
  'newsletter_email_settings.email_config_fetch_failed';
const EMAIL_TEMPLATE_FETCH_FAILED_EVENT =
  'newsletter_email_settings.email_template_fetch_failed';
const REPLY_TO_INVALID_EVENT = 'newsletter_email_settings.reply_to_invalid';

const MOCK_FROM_ADDRESS = faker.internet.email();
const MOCK_CONFIGURED_FROM_ADDRESS = `${faker.company.name()} <${MOCK_FROM_ADDRESS}>`;
const MOCK_TENANT_LOGO_URL = faker.image.url();
const MOCK_TEMPLATE_LOGO_URL = faker.image.url();
const MOCK_SENDER_NAME = faker.company.name();
const MOCK_REPLY_TO_ADDRESS = faker.internet.email();
const MOCK_FOOTER_POSTAL_ADDRESS = faker.location.streetAddress();
const MOCK_INJECTED_EMAIL = faker.internet.email();
const MOCK_INJECTED_NAME = faker.person.firstName();
const MOCK_MALFORMED_ADDRESS = faker.lorem.word();
const MOCK_TEMPLATE = mockEmailTemplate();

const defaultCopyFor = (locale: TLocaleIsoCode) =>
  EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE[locale][
    EMAIL_TEMPLATE_TYPE.NEWSLETTER_CONFIRMATION
  ];

const DEFAULT_SETTINGS = {
  subject: MOCK_TEMPLATE.subject,
  body: MOCK_TEMPLATE.body,
  logoImageUrl: undefined,
  footerPostalAddress: undefined,
  fromAddress: MOCK_CONFIGURED_FROM_ADDRESS,
  replyTo: undefined,
};

const resolve = (locale?: TMaybeUndefined<TLocaleIsoCode>) =>
  resolveNewsletterEmailSettings(
    MOCK_TENANT_ID,
    MOCK_CONFIGURED_FROM_ADDRESS,
    locale,
  );

describe(resolveNewsletterEmailSettings, () => {
  beforeEach(() => {
    getEmailConfigMock.mockReset();
    getEmailTemplateMock.mockReset();
    getEmailConfigMock.mockResolvedValue(undefined);
    getEmailTemplateMock.mockResolvedValue(MOCK_TEMPLATE);
  });

  it('returns product defaults when the tenant has no email_config row', async () => {
    await expect(resolve()).resolves.toEqual(DEFAULT_SETTINGS);
  });

  it.each([
    ['the given language', LOCALE_ISO_CODES.FR],
    ["the tenant's default language when none is given", undefined],
  ])('reads the template in %s', async (_case, locale) => {
    await resolve(locale);

    expect(getEmailTemplateMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      EMAIL_TEMPLATE_TYPE.NEWSLETTER_CONFIRMATION,
      locale,
    );
  });

  it.each([
    [
      'the per-template logo when set',
      MOCK_TEMPLATE_LOGO_URL,
      MOCK_TEMPLATE_LOGO_URL,
    ],
    ['the tenant-level logo otherwise', undefined, MOCK_TENANT_LOGO_URL],
  ])('uses %s', async (_case, templateLogo, expected) => {
    getEmailConfigMock.mockResolvedValue(
      mockEmailConfig({ logoAssetUrl: MOCK_TENANT_LOGO_URL }),
    );
    getEmailTemplateMock.mockResolvedValue(
      mockEmailTemplate({ logoAssetUrl: templateLogo }),
    );

    const { logoImageUrl } = await resolve();

    expect(logoImageUrl).toBe(expected);
  });

  it.each([
    [
      'a sender name',
      MOCK_SENDER_NAME,
      `${MOCK_SENDER_NAME} <${MOCK_FROM_ADDRESS}>`,
    ],
    [
      'line breaks in a sender name',
      `${MOCK_INJECTED_NAME}\r\nBcc: ${MOCK_INJECTED_EMAIL}`,
      `${MOCK_INJECTED_NAME}Bcc: ${MOCK_INJECTED_EMAIL} <${MOCK_FROM_ADDRESS}>`,
    ],
    [
      'angle brackets in a sender name',
      `${MOCK_INJECTED_NAME} <${MOCK_INJECTED_EMAIL}>`,
      `${MOCK_INJECTED_NAME} ${MOCK_INJECTED_EMAIL} <${MOCK_FROM_ADDRESS}>`,
    ],
    [
      'a sender name left empty by sanitizing',
      '   ',
      MOCK_CONFIGURED_FROM_ADDRESS,
    ],
  ])('applies %s to the from header', async (_case, senderName, expected) => {
    getEmailConfigMock.mockResolvedValue(mockEmailConfig({ senderName }));

    const { fromAddress } = await resolve();

    expect(fromAddress).toBe(expected);
  });

  it.each([
    [
      'a well-formed reply-to address',
      { replyToAddress: MOCK_REPLY_TO_ADDRESS },
      { replyTo: MOCK_REPLY_TO_ADDRESS },
    ],
    [
      'the footer postal address',
      { footerPostalAddress: MOCK_FOOTER_POSTAL_ADDRESS },
      { footerPostalAddress: MOCK_FOOTER_POSTAL_ADDRESS },
    ],
  ])('passes %s through', async (_case, config, expected) => {
    getEmailConfigMock.mockResolvedValue(mockEmailConfig(config));

    await expect(resolve()).resolves.toEqual({
      ...DEFAULT_SETTINGS,
      ...expected,
    });
  });

  it('drops a malformed reply-to address and logs it', async () => {
    getEmailConfigMock.mockResolvedValue(
      mockEmailConfig({ replyToAddress: MOCK_MALFORMED_ADDRESS }),
    );

    const { replyTo } = await resolve();

    expect(replyTo).toBeUndefined();
    expect(vi.mocked(logger.warn)).toHaveBeenCalledWith(
      REPLY_TO_INVALID_EVENT,
      { tenantId: MOCK_TENANT_ID },
    );
  });

  it('falls back to product defaults and logs when the email config read fails', async () => {
    getEmailConfigMock.mockRejectedValue(MOCK_ERROR);

    await expect(resolve()).resolves.toEqual(DEFAULT_SETTINGS);
    expect(vi.mocked(logger.warn)).toHaveBeenCalledWith(
      EMAIL_CONFIG_FETCH_FAILED_EVENT,
      { tenantId: MOCK_TENANT_ID, error: MOCK_ERROR },
    );
  });

  it.each([LOCALE_ISO_CODES.EN, LOCALE_ISO_CODES.FR])(
    'falls back to the %s default copy and logs when the template read fails',
    async (locale) => {
      const { subject, body } = defaultCopyFor(locale);
      getEmailTemplateMock.mockRejectedValue(MOCK_ERROR);

      await expect(resolve(locale)).resolves.toEqual({
        ...DEFAULT_SETTINGS,
        subject,
        body,
      });
      expect(vi.mocked(logger.warn)).toHaveBeenCalledWith(
        EMAIL_TEMPLATE_FETCH_FAILED_EVENT,
        { tenantId: MOCK_TENANT_ID, error: MOCK_ERROR },
      );
    },
  );

  it('keeps the per-template logo when the email config read fails', async () => {
    getEmailConfigMock.mockRejectedValue(MOCK_ERROR);
    getEmailTemplateMock.mockResolvedValue(
      mockEmailTemplate({ logoAssetUrl: MOCK_TEMPLATE_LOGO_URL }),
    );

    const { logoImageUrl } = await resolve();

    expect(logoImageUrl).toBe(MOCK_TEMPLATE_LOGO_URL);
  });

  it('keeps the email config values when the template read fails', async () => {
    const { subject, body } = defaultCopyFor(LOCALE_ISO_CODES.EN);
    getEmailTemplateMock.mockRejectedValue(MOCK_ERROR);
    getEmailConfigMock.mockResolvedValue(
      mockEmailConfig({
        logoAssetUrl: MOCK_TENANT_LOGO_URL,
        senderName: MOCK_SENDER_NAME,
        replyToAddress: MOCK_REPLY_TO_ADDRESS,
        footerPostalAddress: MOCK_FOOTER_POSTAL_ADDRESS,
      }),
    );

    await expect(resolve()).resolves.toEqual({
      subject,
      body,
      logoImageUrl: MOCK_TENANT_LOGO_URL,
      footerPostalAddress: MOCK_FOOTER_POSTAL_ADDRESS,
      fromAddress: `${MOCK_SENDER_NAME} <${MOCK_FROM_ADDRESS}>`,
      replyTo: MOCK_REPLY_TO_ADDRESS,
    });
  });
});
