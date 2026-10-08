import { EMAIL_TEMPLATE_TYPE, LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  EMAIL_TEMPLATE_DEFAULT_COPY,
  EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE,
} from '@blog/db/constants';

import { resolveMagicLinkEmailSettings } from './resolve-magic-link-email-settings';

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
      senderName: 'Acme Support',
      replyToAddress: 'support@acme.example.com',
      footerPostalAddress: '123 Main St, Springfield',
    });

    const result = await resolveMagicLinkEmailSettings(
      'tenant-1',
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      LOCALE_ISO_CODES.EN,
    );

    expect(result).toEqual({
      subject: MAGIC_LINK_DEFAULTS.subject,
      body: MAGIC_LINK_DEFAULTS.body,
      logoImageUrl: undefined,
      senderName: 'Acme Support',
      replyTo: 'support@acme.example.com',
      footerPostalAddress: '123 Main St, Springfield',
    });
  });

  it('resolves the authored subject and body from the fetched template', async () => {
    getEmailTemplateMock.mockResolvedValue({
      subject: 'Welcome back to Acme',
      body: [{ _type: 'block', _key: 'authored-1' }],
      logoAssetUrl: undefined,
    });

    const result = await resolveMagicLinkEmailSettings(
      'tenant-1',
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      LOCALE_ISO_CODES.EN,
    );

    expect(result.subject).toBe('Welcome back to Acme');
    expect(result.body).toEqual([{ _type: 'block', _key: 'authored-1' }]);
  });

  it('resolves to all-undefined settings when the tenant has no email_config row', async () => {
    const result = await resolveMagicLinkEmailSettings(
      'tenant-1',
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
      logoAssetUrl: 'https://cdn.example.com/tenant-logo.png',
      senderName: undefined,
      replyToAddress: undefined,
      footerPostalAddress: undefined,
    });
    getEmailTemplateMock.mockResolvedValue({
      subject: MAGIC_LINK_DEFAULTS.subject,
      body: MAGIC_LINK_DEFAULTS.body,
      logoAssetUrl: 'https://cdn.example.com/template-logo.png',
    });

    const result = await resolveMagicLinkEmailSettings(
      'tenant-1',
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      LOCALE_ISO_CODES.EN,
    );

    expect(result.logoImageUrl).toBe(
      'https://cdn.example.com/template-logo.png',
    );
  });

  it('falls back to the tenant-level email logo when no per-template logo is set', async () => {
    getEmailConfigMock.mockResolvedValue({
      logoAssetUrl: 'https://cdn.example.com/tenant-logo.png',
      senderName: undefined,
      replyToAddress: undefined,
      footerPostalAddress: undefined,
    });

    const result = await resolveMagicLinkEmailSettings(
      'tenant-1',
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      LOCALE_ISO_CODES.EN,
    );

    expect(result.logoImageUrl).toBe('https://cdn.example.com/tenant-logo.png');
  });

  it('drops a malformed reply-to address rather than passing it through', async () => {
    getEmailConfigMock.mockResolvedValue({
      logoAssetUrl: undefined,
      senderName: undefined,
      replyToAddress: 'not-an-email',
      footerPostalAddress: undefined,
    });

    const result = await resolveMagicLinkEmailSettings(
      'tenant-1',
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      LOCALE_ISO_CODES.EN,
    );

    expect(result.replyTo).toBeUndefined();
  });

  it('falls back to product-default subject and body when getEmailTemplate fails', async () => {
    getEmailConfigMock.mockResolvedValue({
      logoAssetUrl: 'https://cdn.example.com/tenant-logo.png',
      senderName: 'Acme Support',
      replyToAddress: undefined,
      footerPostalAddress: undefined,
    });
    getEmailTemplateMock.mockRejectedValue(new Error('db error'));

    const result = await resolveMagicLinkEmailSettings(
      'tenant-1',
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      LOCALE_ISO_CODES.EN,
    );

    expect(result).toEqual({
      subject: MAGIC_LINK_DEFAULTS.subject,
      body: MAGIC_LINK_DEFAULTS.body,
      logoImageUrl: 'https://cdn.example.com/tenant-logo.png',
      senderName: 'Acme Support',
      replyTo: undefined,
      footerPostalAddress: undefined,
    });
  });

  it('resolves the product-default TENANT_INVITE subject and body when the template lookup fails', async () => {
    getEmailTemplateMock.mockRejectedValue(new Error('db error'));

    const result = await resolveMagicLinkEmailSettings(
      'tenant-1',
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
      'tenant-1',
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      LOCALE_ISO_CODES.FR,
    );

    expect(getEmailTemplateMock).toHaveBeenCalledWith(
      'tenant-1',
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      LOCALE_ISO_CODES.FR,
    );
  });

  it("falls back to the product default in the recipient's language when the template lookup fails", async () => {
    getEmailTemplateMock.mockRejectedValue(new Error('db error'));

    const result = await resolveMagicLinkEmailSettings(
      'tenant-1',
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
      getEmailConfigMock.mockRejectedValue(new Error('db error'));
    });

    it('resolves to product defaults rather than throwing when getEmailConfig fails', async () => {
      getEmailTemplateMock.mockResolvedValue({
        subject: MAGIC_LINK_DEFAULTS.subject,
        body: MAGIC_LINK_DEFAULTS.body,
        logoAssetUrl: 'https://cdn.example.com/template-logo.png',
      });

      const result = await resolveMagicLinkEmailSettings(
        'tenant-1',
        EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
        LOCALE_ISO_CODES.EN,
      );

      expect(result).toEqual({
        subject: MAGIC_LINK_DEFAULTS.subject,
        body: MAGIC_LINK_DEFAULTS.body,
        logoImageUrl: 'https://cdn.example.com/template-logo.png',
        senderName: undefined,
        replyTo: undefined,
        footerPostalAddress: undefined,
      });
    });

    it('resolves to product defaults across the board when both lookups fail', async () => {
      getEmailTemplateMock.mockRejectedValue(new Error('db error'));

      const result = await resolveMagicLinkEmailSettings(
        'tenant-1',
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
