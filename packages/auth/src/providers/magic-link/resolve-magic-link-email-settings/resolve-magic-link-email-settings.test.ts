import {
  MOCK_DB_ERROR_MESSAGE,
  MOCK_POSTAL_ADDRESS,
  MOCK_REPLY_TO,
  MOCK_SENDER_NAME,
  MOCK_SUBJECT,
  MOCK_TEMPLATE_LOGO_URL,
  MOCK_TENANT_ID,
  MOCK_TENANT_LOGO_URL,
} from '@blog/auth/testing/magic-link-fixtures';
import { EMAIL_TEMPLATE_TYPE, LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  EMAIL_TEMPLATE_DEFAULT_COPY,
  EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE,
} from '@blog/db/constants';

import { resolveMagicLinkEmailSettings } from './resolve-magic-link-email-settings';

const AUTHORED_BLOCK_KEY = 'authored-1';

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

const MAGIC_LINK_DEFAULTS =
  EMAIL_TEMPLATE_DEFAULT_COPY[EMAIL_TEMPLATE_TYPE.MAGIC_LINK];

describe(resolveMagicLinkEmailSettings, () => {
  beforeEach(() => {
    getEmailConfigMock.mockReset();
    getEmailTemplateMock.mockReset();
    getEmailConfigMock.mockResolvedValue(undefined);
    getEmailTemplateMock.mockResolvedValue({
      subject: MAGIC_LINK_DEFAULTS.subject,
      body: MAGIC_LINK_DEFAULTS.body,
      logoAssetUrl: undefined,
    });
  });

  it('resolves sender name, reply-to and footer address from email_config', async () => {
    getEmailConfigMock.mockResolvedValue({
      logoAssetUrl: undefined,
      senderName: MOCK_SENDER_NAME,
      replyToAddress: MOCK_REPLY_TO,
      footerPostalAddress: MOCK_POSTAL_ADDRESS,
    });

    const result = await resolveMagicLinkEmailSettings(
      MOCK_TENANT_ID,
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      LOCALE_ISO_CODES.EN,
    );

    expect(result).toEqual({
      subject: MAGIC_LINK_DEFAULTS.subject,
      body: MAGIC_LINK_DEFAULTS.body,
      logoImageUrl: undefined,
      senderName: MOCK_SENDER_NAME,
      replyTo: MOCK_REPLY_TO,
      footerPostalAddress: MOCK_POSTAL_ADDRESS,
    });
  });

  it('resolves the authored subject and body from the fetched template', async () => {
    getEmailTemplateMock.mockResolvedValue({
      subject: MOCK_SUBJECT,
      body: [{ _type: 'block', _key: AUTHORED_BLOCK_KEY }],
      logoAssetUrl: undefined,
    });

    const result = await resolveMagicLinkEmailSettings(
      MOCK_TENANT_ID,
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      LOCALE_ISO_CODES.EN,
    );

    expect(result.subject).toBe(MOCK_SUBJECT);
    expect(result.body).toEqual([{ _type: 'block', _key: AUTHORED_BLOCK_KEY }]);
  });

  it('resolves to all-undefined settings when the tenant has no email_config row', async () => {
    const result = await resolveMagicLinkEmailSettings(
      MOCK_TENANT_ID,
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      LOCALE_ISO_CODES.EN,
    );

    expect(result).toEqual({
      subject: MAGIC_LINK_DEFAULTS.subject,
      body: MAGIC_LINK_DEFAULTS.body,
      logoImageUrl: undefined,
      senderName: undefined,
      replyTo: undefined,
      footerPostalAddress: undefined,
    });
  });

  it('prefers the per-template logo over the tenant-level email logo', async () => {
    getEmailConfigMock.mockResolvedValue({
      logoAssetUrl: MOCK_TENANT_LOGO_URL,
      senderName: undefined,
      replyToAddress: undefined,
      footerPostalAddress: undefined,
    });
    getEmailTemplateMock.mockResolvedValue({
      subject: MAGIC_LINK_DEFAULTS.subject,
      body: MAGIC_LINK_DEFAULTS.body,
      logoAssetUrl: MOCK_TEMPLATE_LOGO_URL,
    });

    const result = await resolveMagicLinkEmailSettings(
      MOCK_TENANT_ID,
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      LOCALE_ISO_CODES.EN,
    );

    expect(result.logoImageUrl).toBe(MOCK_TEMPLATE_LOGO_URL);
  });

  it('falls back to the tenant-level email logo when no per-template logo is set', async () => {
    getEmailConfigMock.mockResolvedValue({
      logoAssetUrl: MOCK_TENANT_LOGO_URL,
      senderName: undefined,
      replyToAddress: undefined,
      footerPostalAddress: undefined,
    });

    const result = await resolveMagicLinkEmailSettings(
      MOCK_TENANT_ID,
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      LOCALE_ISO_CODES.EN,
    );

    expect(result.logoImageUrl).toBe(MOCK_TENANT_LOGO_URL);
  });

  it('drops a malformed reply-to address rather than passing it through', async () => {
    getEmailConfigMock.mockResolvedValue({
      logoAssetUrl: undefined,
      senderName: undefined,
      replyToAddress: 'not-an-email',
      footerPostalAddress: undefined,
    });

    const result = await resolveMagicLinkEmailSettings(
      MOCK_TENANT_ID,
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      LOCALE_ISO_CODES.EN,
    );

    expect(result.replyTo).toBeUndefined();
  });

  it('falls back to product-default subject and body when getEmailTemplate fails', async () => {
    getEmailConfigMock.mockResolvedValue({
      logoAssetUrl: MOCK_TENANT_LOGO_URL,
      senderName: MOCK_SENDER_NAME,
      replyToAddress: undefined,
      footerPostalAddress: undefined,
    });
    getEmailTemplateMock.mockRejectedValue(new Error(MOCK_DB_ERROR_MESSAGE));

    const result = await resolveMagicLinkEmailSettings(
      MOCK_TENANT_ID,
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      LOCALE_ISO_CODES.EN,
    );

    expect(result).toEqual({
      subject: MAGIC_LINK_DEFAULTS.subject,
      body: MAGIC_LINK_DEFAULTS.body,
      logoImageUrl: MOCK_TENANT_LOGO_URL,
      senderName: MOCK_SENDER_NAME,
      replyTo: undefined,
      footerPostalAddress: undefined,
    });
  });

  it('resolves the product-default TENANT_INVITE subject and body when the template lookup fails', async () => {
    getEmailTemplateMock.mockRejectedValue(new Error(MOCK_DB_ERROR_MESSAGE));

    const result = await resolveMagicLinkEmailSettings(
      MOCK_TENANT_ID,
      EMAIL_TEMPLATE_TYPE.TENANT_INVITE,
      LOCALE_ISO_CODES.EN,
    );

    const inviteDefaults =
      EMAIL_TEMPLATE_DEFAULT_COPY[EMAIL_TEMPLATE_TYPE.TENANT_INVITE];
    expect(result.subject).toBe(inviteDefaults.subject);
    expect(result.body).toEqual(inviteDefaults.body);
  });

  it("looks the template up in the recipient's language", async () => {
    await resolveMagicLinkEmailSettings(
      MOCK_TENANT_ID,
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      LOCALE_ISO_CODES.FR,
    );

    expect(getEmailTemplateMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      LOCALE_ISO_CODES.FR,
    );
  });

  it("falls back to the product default in the recipient's language when the template lookup fails", async () => {
    getEmailTemplateMock.mockRejectedValue(new Error(MOCK_DB_ERROR_MESSAGE));

    const result = await resolveMagicLinkEmailSettings(
      MOCK_TENANT_ID,
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      LOCALE_ISO_CODES.DE,
    );

    const germanDefaults =
      EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE[LOCALE_ISO_CODES.DE][
        EMAIL_TEMPLATE_TYPE.MAGIC_LINK
      ];
    expect(result.subject).toBe(germanDefaults.subject);
    expect(result.body).toEqual(germanDefaults.body);
  });

  describe('when getEmailConfig fails', () => {
    beforeEach(() => {
      getEmailConfigMock.mockRejectedValue(new Error(MOCK_DB_ERROR_MESSAGE));
    });

    it('resolves to product defaults rather than throwing when getEmailConfig fails', async () => {
      getEmailTemplateMock.mockResolvedValue({
        subject: MAGIC_LINK_DEFAULTS.subject,
        body: MAGIC_LINK_DEFAULTS.body,
        logoAssetUrl: MOCK_TEMPLATE_LOGO_URL,
      });

      const result = await resolveMagicLinkEmailSettings(
        MOCK_TENANT_ID,
        EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
        LOCALE_ISO_CODES.EN,
      );

      expect(result).toEqual({
        subject: MAGIC_LINK_DEFAULTS.subject,
        body: MAGIC_LINK_DEFAULTS.body,
        logoImageUrl: MOCK_TEMPLATE_LOGO_URL,
        senderName: undefined,
        replyTo: undefined,
        footerPostalAddress: undefined,
      });
    });

    it('resolves to product defaults across the board when both lookups fail', async () => {
      getEmailTemplateMock.mockRejectedValue(new Error(MOCK_DB_ERROR_MESSAGE));

      const result = await resolveMagicLinkEmailSettings(
        MOCK_TENANT_ID,
        EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
        LOCALE_ISO_CODES.EN,
      );

      expect(result).toEqual({
        subject: MAGIC_LINK_DEFAULTS.subject,
        body: MAGIC_LINK_DEFAULTS.body,
        logoImageUrl: undefined,
        senderName: undefined,
        replyTo: undefined,
        footerPostalAddress: undefined,
      });
    });
  });
});
