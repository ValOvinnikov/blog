import { resolveTenantEmailBrand } from '@blog/config';
import { PRESET_ID } from '@blog/config/constants';

import { buildMagicLinkProvider } from './magic-link-provider';

const {
  findPendingInviteByEmailMock,
  listTenantsByIdsMock,
  getTenantByDomainMock,
  getSiteConfigMock,
  getEmailConfigMock,
  getEmailTemplateMock,
  sendEmailMock,
} = vi.hoisted(() => ({
  findPendingInviteByEmailMock: vi.fn(),
  listTenantsByIdsMock: vi.fn(),
  getTenantByDomainMock: vi.fn(),
  getSiteConfigMock: vi.fn(),
  getEmailConfigMock: vi.fn(),
  getEmailTemplateMock: vi.fn(),
  sendEmailMock: vi.fn(),
}));

vi.mock('@blog/db', () => ({
  queries: {
    membershipInvites: {
      findPendingInviteByEmail: findPendingInviteByEmailMock,
    },
    tenants: { listTenantsByIds: listTenantsByIdsMock },
    tenantDomains: { getTenantByDomain: getTenantByDomainMock },
    siteConfig: { getSiteConfig: getSiteConfigMock },
    emailConfig: { getEmailConfig: getEmailConfigMock },
    emailTemplates: { getEmailTemplate: getEmailTemplateMock },
  },
}));

vi.mock('@blog/email', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/email')>()),
  sendEmail: sendEmailMock,
}));

describe(buildMagicLinkProvider, () => {
  beforeEach(() => {
    findPendingInviteByEmailMock.mockReset().mockResolvedValue([]);
    listTenantsByIdsMock.mockReset();
    getTenantByDomainMock.mockReset().mockResolvedValue(undefined);
    getSiteConfigMock.mockReset();
    getEmailConfigMock.mockReset().mockResolvedValue(undefined);
    getEmailTemplateMock.mockReset().mockResolvedValue({
      logoAssetUrl: undefined,
    });
    sendEmailMock.mockReset().mockResolvedValue(undefined);
  });

  it('identifies itself as the email provider', () => {
    const provider = buildMagicLinkProvider();

    expect(provider.id).toBe('email');
    expect(provider.type).toBe('email');
  });

  // `env.ts` reads MAGIC_LINK_FROM_ADDRESS eagerly on import, and it's unset
  // in this package's vitest env (`vitest.config.ts`) — so the default
  // module state already exercises the fallback branch;
  // `resolve-magic-link-from-address.test.ts` covers the configured case.
  it('resolves the from address via resolveMagicLinkFromAddress', () => {
    const provider = buildMagicLinkProvider();

    expect(provider.from).toBe('Sign in <onboarding@resend.dev>');
  });

  it("delivers the sign-in link through @blog/email's sendEmail", async () => {
    const provider = buildMagicLinkProvider();

    // `sendVerificationRequest` only reads `identifier`/`url`; the rest are
    // filled with placeholders that satisfy the full param type.
    await provider.sendVerificationRequest({
      identifier: 'jane@example.com',
      url: 'https://example.com/api/auth/callback/email?token=abc',
      expires: new Date('2026-01-01T00:00:00.000Z'),
      provider,
      token: 'abc',
      theme: {},
      request: new Request('https://example.com'),
    });

    expect(sendEmailMock).toHaveBeenCalledWith({
      to: 'jane@example.com',
      from: 'Sign in <onboarding@resend.dev>',
      subject: 'Sign in to example.com',
      html: expect.stringContaining(
        'href="https://example.com/api/auth/callback/email?token=abc"',
      ),
    });
  });

  it('sends invite-flavored copy when the identifier has a pending invite', async () => {
    findPendingInviteByEmailMock.mockResolvedValue([
      { id: 'invite-1', tenantId: 'tenant-1' },
    ]);
    listTenantsByIdsMock.mockResolvedValue([
      { id: 'tenant-1', name: 'Acme Blog' },
    ]);
    const provider = buildMagicLinkProvider();

    await provider.sendVerificationRequest({
      identifier: 'invited@example.com',
      url: 'https://example.com/api/auth/callback/email?token=abc',
      expires: new Date('2026-01-01T00:00:00.000Z'),
      provider,
      token: 'abc',
      theme: {},
      request: new Request('https://example.com'),
    });

    expect(findPendingInviteByEmailMock).toHaveBeenCalledWith(
      'invited@example.com',
    );
    expect(sendEmailMock).toHaveBeenCalledWith({
      to: 'invited@example.com',
      from: 'Sign in <onboarding@resend.dev>',
      subject: "You've been invited to manage Acme Blog",
      html: expect.stringContaining('<strong>Acme Blog</strong>'),
    });
  });

  it('falls back to the generic copy and still delivers when the invite lookup throws', async () => {
    findPendingInviteByEmailMock.mockRejectedValue(new Error('db error'));
    const provider = buildMagicLinkProvider();

    await provider.sendVerificationRequest({
      identifier: 'jane@example.com',
      url: 'https://example.com/api/auth/callback/email?token=abc',
      expires: new Date('2026-01-01T00:00:00.000Z'),
      provider,
      token: 'abc',
      theme: {},
      request: new Request('https://example.com'),
    });

    expect(sendEmailMock).toHaveBeenCalledWith({
      to: 'jane@example.com',
      from: 'Sign in <onboarding@resend.dev>',
      subject: 'Sign in to example.com',
      html: expect.stringContaining(
        'href="https://example.com/api/auth/callback/email?token=abc"',
      ),
    });
  });

  it('still delivers, unbranded, when the host resolves to no tenant', async () => {
    getTenantByDomainMock.mockResolvedValue(undefined);
    const provider = buildMagicLinkProvider();

    await provider.sendVerificationRequest({
      identifier: 'jane@example.com',
      url: 'https://example.com/api/auth/callback/email?token=abc',
      expires: new Date('2026-01-01T00:00:00.000Z'),
      provider,
      token: 'abc',
      theme: {},
      request: new Request('https://example.com'),
    });

    expect(sendEmailMock).toHaveBeenCalledWith({
      to: 'jane@example.com',
      from: 'Sign in <onboarding@resend.dev>',
      subject: 'Sign in to example.com',
      html: expect.not.stringContaining('<!doctype html>'),
    });
  });

  it('still delivers, unbranded, when the tenant domain lookup throws', async () => {
    getTenantByDomainMock.mockRejectedValue(new Error('db error'));
    const provider = buildMagicLinkProvider();

    await provider.sendVerificationRequest({
      identifier: 'jane@example.com',
      url: 'https://example.com/api/auth/callback/email?token=abc',
      expires: new Date('2026-01-01T00:00:00.000Z'),
      provider,
      token: 'abc',
      theme: {},
      request: new Request('https://example.com'),
    });

    expect(sendEmailMock).toHaveBeenCalledWith({
      to: 'jane@example.com',
      from: 'Sign in <onboarding@resend.dev>',
      subject: 'Sign in to example.com',
      html: expect.not.stringContaining('<!doctype html>'),
    });
  });

  it("brands the sign-in email with the resolved tenant's hue", async () => {
    getTenantByDomainMock.mockResolvedValue({
      id: 'tenant-1',
      name: 'Acme Blog',
    });
    getSiteConfigMock.mockResolvedValue({
      preset: PRESET_ID.CONSOLE,
      accentHue: 140,
      logoHue: undefined,
    });
    const provider = buildMagicLinkProvider();

    await provider.sendVerificationRequest({
      identifier: 'jane@example.com',
      url: 'https://example.com/api/auth/callback/email?token=abc',
      expires: new Date('2026-01-01T00:00:00.000Z'),
      provider,
      token: 'abc',
      theme: {},
      request: new Request('https://example.com'),
    });

    const expectedBrand = resolveTenantEmailBrand({
      preset: PRESET_ID.CONSOLE,
      accentHue: 140,
    });
    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining(expectedBrand.logo1),
      }),
    );
  });

  it("applies the tenant's sender name and reply-to address", async () => {
    getTenantByDomainMock.mockResolvedValue({
      id: 'tenant-1',
      name: 'Acme Blog',
    });
    getSiteConfigMock.mockResolvedValue({
      preset: PRESET_ID.CONSOLE,
      accentHue: 140,
      logoHue: undefined,
    });
    getEmailConfigMock.mockResolvedValue({
      logoAssetUrl: undefined,
      senderName: 'Acme Support',
      replyToAddress: 'support@acme.example.com',
      footerPostalAddress: undefined,
    });
    const provider = buildMagicLinkProvider();

    await provider.sendVerificationRequest({
      identifier: 'jane@example.com',
      url: 'https://example.com/api/auth/callback/email?token=abc',
      expires: new Date('2026-01-01T00:00:00.000Z'),
      provider,
      token: 'abc',
      theme: {},
      request: new Request('https://example.com'),
    });

    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'Acme Support <onboarding@resend.dev>',
        replyTo: 'support@acme.example.com',
      }),
    );
  });

  it('drops a malformed stored reply-to address rather than blocking the send', async () => {
    getTenantByDomainMock.mockResolvedValue({
      id: 'tenant-1',
      name: 'Acme Blog',
    });
    getSiteConfigMock.mockResolvedValue({
      preset: PRESET_ID.CONSOLE,
      accentHue: 140,
      logoHue: undefined,
    });
    getEmailConfigMock.mockResolvedValue({
      logoAssetUrl: undefined,
      senderName: undefined,
      replyToAddress: 'not-an-email',
      footerPostalAddress: undefined,
    });
    const provider = buildMagicLinkProvider();

    await provider.sendVerificationRequest({
      identifier: 'jane@example.com',
      url: 'https://example.com/api/auth/callback/email?token=abc',
      expires: new Date('2026-01-01T00:00:00.000Z'),
      provider,
      token: 'abc',
      theme: {},
      request: new Request('https://example.com'),
    });

    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({ replyTo: undefined }),
    );
  });

  it('renders the resolved logo and footer postal address in the sent email', async () => {
    getTenantByDomainMock.mockResolvedValue({
      id: 'tenant-1',
      name: 'Acme Blog',
    });
    getSiteConfigMock.mockResolvedValue({
      preset: PRESET_ID.CONSOLE,
      accentHue: 140,
      logoHue: undefined,
    });
    getEmailConfigMock.mockResolvedValue({
      logoAssetUrl: 'https://cdn.example.com/tenant-logo.png',
      senderName: undefined,
      replyToAddress: undefined,
      footerPostalAddress: '123 Main St, Springfield',
    });
    getEmailTemplateMock.mockResolvedValue({
      logoAssetUrl: 'https://cdn.example.com/template-logo.png',
    });
    const provider = buildMagicLinkProvider();

    await provider.sendVerificationRequest({
      identifier: 'jane@example.com',
      url: 'https://example.com/api/auth/callback/email?token=abc',
      expires: new Date('2026-01-01T00:00:00.000Z'),
      provider,
      token: 'abc',
      theme: {},
      request: new Request('https://example.com'),
    });

    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining(
          'src="https://cdn.example.com/template-logo.png"',
        ),
      }),
    );
    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining('123 Main St, Springfield'),
      }),
    );
  });

  it('still delivers with product defaults when the email-config lookup fails', async () => {
    getTenantByDomainMock.mockResolvedValue({
      id: 'tenant-1',
      name: 'Acme Blog',
    });
    getSiteConfigMock.mockResolvedValue({
      preset: PRESET_ID.CONSOLE,
      accentHue: 140,
      logoHue: undefined,
    });
    getEmailConfigMock.mockRejectedValue(new Error('db error'));
    const provider = buildMagicLinkProvider();

    await provider.sendVerificationRequest({
      identifier: 'jane@example.com',
      url: 'https://example.com/api/auth/callback/email?token=abc',
      expires: new Date('2026-01-01T00:00:00.000Z'),
      provider,
      token: 'abc',
      theme: {},
      request: new Request('https://example.com'),
    });

    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'Sign in <onboarding@resend.dev>',
        replyTo: undefined,
      }),
    );
  });

  it('still delivers with product defaults when the email-template lookup fails', async () => {
    getTenantByDomainMock.mockResolvedValue({
      id: 'tenant-1',
      name: 'Acme Blog',
    });
    getSiteConfigMock.mockResolvedValue({
      preset: PRESET_ID.CONSOLE,
      accentHue: 140,
      logoHue: undefined,
    });
    getEmailConfigMock.mockResolvedValue({
      logoAssetUrl: undefined,
      senderName: 'Acme Support',
      replyToAddress: undefined,
      footerPostalAddress: undefined,
    });
    getEmailTemplateMock.mockRejectedValue(new Error('db error'));
    const provider = buildMagicLinkProvider();

    await provider.sendVerificationRequest({
      identifier: 'jane@example.com',
      url: 'https://example.com/api/auth/callback/email?token=abc',
      expires: new Date('2026-01-01T00:00:00.000Z'),
      provider,
      token: 'abc',
      theme: {},
      request: new Request('https://example.com'),
    });

    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'Acme Support <onboarding@resend.dev>',
      }),
    );
  });
});
