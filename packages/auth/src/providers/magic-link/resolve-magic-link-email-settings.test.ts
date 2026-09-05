import { EMAIL_TEMPLATE_TYPE } from '@blog/config/constants';

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
      logoAssetUrl: undefined,
    });

    const result = await resolveMagicLinkEmailSettings(
      'tenant-1',
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
    );

    expect(result).toEqual({
      logoImageUrl: undefined,
      senderName: 'Acme Support',
      replyTo: 'support@acme.example.com',
      footerPostalAddress: '123 Main St, Springfield',
    });
  });

  it('resolves to all-undefined when the tenant has no email_config row', async () => {
    getEmailConfigMock.mockResolvedValue(undefined);
    getEmailTemplateMock.mockResolvedValue({ logoAssetUrl: undefined });

    const result = await resolveMagicLinkEmailSettings(
      'tenant-1',
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
    );

    expect(result).toEqual({
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
    getEmailTemplateMock.mockResolvedValue({ logoAssetUrl: undefined });

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
    getEmailTemplateMock.mockResolvedValue({ logoAssetUrl: undefined });

    const result = await resolveMagicLinkEmailSettings(
      'tenant-1',
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
    );

    expect(result.replyTo).toBeUndefined();
  });

  it('resolves to product defaults rather than throwing when getEmailConfig fails', async () => {
    getEmailConfigMock.mockRejectedValue(new Error('db error'));
    getEmailTemplateMock.mockResolvedValue({
      logoAssetUrl: 'https://cdn.example.com/template-logo.png',
    });

    const result = await resolveMagicLinkEmailSettings(
      'tenant-1',
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
    );

    expect(result).toEqual({
      logoImageUrl: 'https://cdn.example.com/template-logo.png',
      senderName: undefined,
      replyTo: undefined,
      footerPostalAddress: undefined,
    });
  });

  it('resolves to product defaults rather than throwing when getEmailTemplate fails', async () => {
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
      logoImageUrl: 'https://cdn.example.com/tenant-logo.png',
      senderName: 'Acme Support',
      replyTo: undefined,
      footerPostalAddress: undefined,
    });
  });

  it('resolves to all-undefined rather than throwing when both lookups fail', async () => {
    getEmailConfigMock.mockRejectedValue(new Error('db error'));
    getEmailTemplateMock.mockRejectedValue(new Error('db error'));

    const result = await resolveMagicLinkEmailSettings(
      'tenant-1',
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
    );

    expect(result).toEqual({
      logoImageUrl: undefined,
      senderName: undefined,
      replyTo: undefined,
      footerPostalAddress: undefined,
    });
  });
});
