import { EMAIL_TEMPLATE_TYPE } from '@blog/config/constants';
import { EMAIL_TEMPLATE_DEFAULT_COPY } from '@blog/db/constants';

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
  });

  it('resolves sender name, reply-to and footer address from email_config', async () => {
    getEmailConfigMock.mockResolvedValue({
      logoAssetUrl: undefined,
      senderName: 'Acme Support',
      replyToAddress: 'support@acme.example.com',
      footerPostalAddress: '123 Main St, Springfield',
    });
    getEmailTemplateMock.mockResolvedValue({
      subject: MAGIC_LINK_DEFAULTS.subject,
      body: MAGIC_LINK_DEFAULTS.body,
      logoAssetUrl: undefined,
    });

    const result = await resolveMagicLinkEmailSettings(
      'tenant-1',
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
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
    getEmailConfigMock.mockResolvedValue(undefined);
    getEmailTemplateMock.mockResolvedValue({
      subject: 'Welcome back to Acme',
      body: [{ _type: 'block', _key: 'authored-1' }],
      logoAssetUrl: undefined,
    });

    const result = await resolveMagicLinkEmailSettings(
      'tenant-1',
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
    );

    expect(result.subject).toBe('Welcome back to Acme');
    expect(result.body).toEqual([{ _type: 'block', _key: 'authored-1' }]);
  });

  it('resolves to all-undefined settings when the tenant has no email_config row', async () => {
    getEmailConfigMock.mockResolvedValue(undefined);
    getEmailTemplateMock.mockResolvedValue({
      subject: MAGIC_LINK_DEFAULTS.subject,
      body: MAGIC_LINK_DEFAULTS.body,
      logoAssetUrl: undefined,
    });

    const result = await resolveMagicLinkEmailSettings(
      'tenant-1',
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
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
    getEmailTemplateMock.mockResolvedValue({
      subject: MAGIC_LINK_DEFAULTS.subject,
      body: MAGIC_LINK_DEFAULTS.body,
      logoAssetUrl: undefined,
    });

    const result = await resolveMagicLinkEmailSettings(
      'tenant-1',
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
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
    getEmailTemplateMock.mockResolvedValue({
      subject: MAGIC_LINK_DEFAULTS.subject,
      body: MAGIC_LINK_DEFAULTS.body,
      logoAssetUrl: undefined,
    });

    const result = await resolveMagicLinkEmailSettings(
      'tenant-1',
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
    );

    expect(result.replyTo).toBeUndefined();
  });

  it('resolves to product defaults rather than throwing when getEmailConfig fails', async () => {
    getEmailConfigMock.mockRejectedValue(new Error('db error'));
    getEmailTemplateMock.mockResolvedValue({
      subject: MAGIC_LINK_DEFAULTS.subject,
      body: MAGIC_LINK_DEFAULTS.body,
      logoAssetUrl: 'https://cdn.example.com/template-logo.png',
    });

    const result = await resolveMagicLinkEmailSettings(
      'tenant-1',
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
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

  it('resolves to product defaults across the board when both lookups fail', async () => {
    getEmailConfigMock.mockRejectedValue(new Error('db error'));
    getEmailTemplateMock.mockRejectedValue(new Error('db error'));

    const result = await resolveMagicLinkEmailSettings(
      'tenant-1',
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
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

  it('resolves the product-default TENANT_INVITE subject and body when the template lookup fails', async () => {
    getEmailConfigMock.mockResolvedValue(undefined);
    getEmailTemplateMock.mockRejectedValue(new Error('db error'));

    const result = await resolveMagicLinkEmailSettings(
      'tenant-1',
      EMAIL_TEMPLATE_TYPE.TENANT_INVITE,
    );

    const inviteDefaults =
      EMAIL_TEMPLATE_DEFAULT_COPY[EMAIL_TEMPLATE_TYPE.TENANT_INVITE];
    expect(result.subject).toBe(inviteDefaults.subject);
    expect(result.body).toEqual(inviteDefaults.body);
  });
});
