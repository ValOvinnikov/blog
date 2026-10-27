import {
  MOCK_DB_ERROR_MESSAGE,
  MOCK_POSTAL_ADDRESS,
  MOCK_REPLY_TO,
  MOCK_SENDER_NAME,
  MOCK_SUBJECT,
  MOCK_TEMPLATE_LOGO_URL,
  MOCK_TENANT_ID,
  MOCK_TENANT_LOGO_URL,
  mockEmailConfig,
  mockEmailTemplate,
} from '@blog/auth/testing/magic-link-fixtures';
import {
  EMAIL_TEMPLATE_TYPE,
  LOCALE_ISO_CODES,
  type TEmailTemplateType,
  type TLocaleIsoCode,
} from '@blog/config/constants';
import {
  EMAIL_TEMPLATE_DEFAULT_COPY,
  EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE,
} from '@blog/db/constants';
import { faker } from '@faker-js/faker';

import { resolveMagicLinkEmailSettings } from './resolve-magic-link-email-settings';

faker.seed(6027);

const MOCK_AUTHORED_BODY = [{ _type: 'block', _key: faker.string.uuid() }];
const MAGIC_LINK_DEFAULTS =
  EMAIL_TEMPLATE_DEFAULT_COPY[EMAIL_TEMPLATE_TYPE.MAGIC_LINK];
const DEFAULT_SETTINGS = {
  subject: MAGIC_LINK_DEFAULTS.subject,
  body: MAGIC_LINK_DEFAULTS.body,
  logoImageUrl: undefined,
  senderName: undefined,
  replyTo: undefined,
  footerPostalAddress: undefined,
};

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

const resolveSettings = (
  templateType: TEmailTemplateType = EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
  locale: TLocaleIsoCode = LOCALE_ISO_CODES.EN,
) => resolveMagicLinkEmailSettings(MOCK_TENANT_ID, templateType, locale);

const failLookup = (lookupMock: typeof getEmailConfigMock) => {
  lookupMock.mockRejectedValue(new Error(MOCK_DB_ERROR_MESSAGE));
};

describe(resolveMagicLinkEmailSettings, () => {
  beforeEach(() => {
    getEmailConfigMock.mockResolvedValue(undefined);
    getEmailTemplateMock.mockResolvedValue(mockEmailTemplate());
  });

  it('resolves sender name, reply-to and footer address from email config', async () => {
    getEmailConfigMock.mockResolvedValue(
      mockEmailConfig({
        senderName: MOCK_SENDER_NAME,
        replyToAddress: MOCK_REPLY_TO,
        footerPostalAddress: MOCK_POSTAL_ADDRESS,
      }),
    );

    const result = await resolveSettings();

    expect(result).toEqual({
      ...DEFAULT_SETTINGS,
      senderName: MOCK_SENDER_NAME,
      replyTo: MOCK_REPLY_TO,
      footerPostalAddress: MOCK_POSTAL_ADDRESS,
    });
  });

  it('resolves the authored subject and body from the fetched template', async () => {
    getEmailTemplateMock.mockResolvedValue(
      mockEmailTemplate({ subject: MOCK_SUBJECT, body: MOCK_AUTHORED_BODY }),
    );

    const result = await resolveSettings();

    expect(result).toEqual({
      ...DEFAULT_SETTINGS,
      subject: MOCK_SUBJECT,
      body: MOCK_AUTHORED_BODY,
    });
  });

  it('resolves the template alone when the tenant has no email config', async () => {
    const result = await resolveSettings();

    expect(result).toEqual(DEFAULT_SETTINGS);
  });

  it.each([
    [
      'the per-template logo when set',
      MOCK_TEMPLATE_LOGO_URL,
      MOCK_TEMPLATE_LOGO_URL,
    ],
    [
      'the tenant-level logo with no per-template logo',
      undefined,
      MOCK_TENANT_LOGO_URL,
    ],
  ])('uses %s', async (_, templateLogoUrl, expectedLogoUrl) => {
    getEmailConfigMock.mockResolvedValue(
      mockEmailConfig({ logoAssetUrl: MOCK_TENANT_LOGO_URL }),
    );
    getEmailTemplateMock.mockResolvedValue(
      mockEmailTemplate({ logoAssetUrl: templateLogoUrl }),
    );

    const result = await resolveSettings();

    expect(result.logoImageUrl).toBe(expectedLogoUrl);
  });

  it('drops a malformed reply-to address rather than passing it through', async () => {
    getEmailConfigMock.mockResolvedValue(
      mockEmailConfig({ replyToAddress: faker.lorem.word() }),
    );

    const result = await resolveSettings();

    expect(result.replyTo).toBeUndefined();
  });

  it("looks the template up in the recipient's language", async () => {
    await resolveSettings(EMAIL_TEMPLATE_TYPE.MAGIC_LINK, LOCALE_ISO_CODES.FR);

    expect(getEmailTemplateMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      LOCALE_ISO_CODES.FR,
    );
  });

  describe('when the template lookup fails', () => {
    beforeEach(() => {
      failLookup(getEmailTemplateMock);
    });

    it('keeps the email config, with the product-default subject and body', async () => {
      getEmailConfigMock.mockResolvedValue(
        mockEmailConfig({
          logoAssetUrl: MOCK_TENANT_LOGO_URL,
          senderName: MOCK_SENDER_NAME,
        }),
      );

      const result = await resolveSettings();

      expect(result).toEqual({
        ...DEFAULT_SETTINGS,
        logoImageUrl: MOCK_TENANT_LOGO_URL,
        senderName: MOCK_SENDER_NAME,
      });
    });

    it.each([
      [EMAIL_TEMPLATE_TYPE.TENANT_INVITE, LOCALE_ISO_CODES.EN],
      [EMAIL_TEMPLATE_TYPE.MAGIC_LINK, LOCALE_ISO_CODES.DE],
    ])(
      'falls back to the %s product default in %s',
      async (templateType, locale) => {
        const result = await resolveSettings(templateType, locale);

        const { subject, body } =
          EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE[locale][templateType];
        expect([result.subject, result.body]).toEqual([subject, body]);
      },
    );
  });

  describe('when the email config lookup fails', () => {
    beforeEach(() => {
      failLookup(getEmailConfigMock);
    });

    it('resolves the template with no tenant email settings', async () => {
      getEmailTemplateMock.mockResolvedValue(
        mockEmailTemplate({ logoAssetUrl: MOCK_TEMPLATE_LOGO_URL }),
      );

      const result = await resolveSettings();

      expect(result).toEqual({
        ...DEFAULT_SETTINGS,
        logoImageUrl: MOCK_TEMPLATE_LOGO_URL,
      });
    });

    it('resolves to product defaults across the board when both lookups fail', async () => {
      failLookup(getEmailTemplateMock);

      const result = await resolveSettings();

      expect(result).toEqual(DEFAULT_SETTINGS);
    });
  });
});
