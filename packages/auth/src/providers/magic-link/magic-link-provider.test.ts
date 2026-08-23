import { buildMagicLinkProvider } from './magic-link-provider';

const { findPendingInviteByEmailMock, listTenantsByIdsMock } = vi.hoisted(
  () => ({
    findPendingInviteByEmailMock: vi.fn(),
    listTenantsByIdsMock: vi.fn(),
  }),
);

vi.mock('@blog/db', () => ({
  queries: {
    membershipInvites: {
      findPendingInviteByEmail: findPendingInviteByEmailMock,
    },
    tenants: { listTenantsByIds: listTenantsByIdsMock },
  },
}));

describe(buildMagicLinkProvider, () => {
  beforeEach(() => {
    findPendingInviteByEmailMock.mockReset().mockResolvedValue([]);
    listTenantsByIdsMock.mockReset();
  });

  it('identifies itself as the email provider', () => {
    const provider = buildMagicLinkProvider(vi.fn());

    expect(provider.id).toBe('email');
    expect(provider.type).toBe('email');
  });

  // `env.ts` reads MAGIC_LINK_FROM_ADDRESS eagerly on import, and it's unset
  // in this package's vitest env (`vitest.config.ts`) — so the default
  // module state already exercises the fallback branch;
  // `resolve-magic-link-from-address.test.ts` covers the configured case.
  it('resolves the from address via resolveMagicLinkFromAddress', () => {
    const provider = buildMagicLinkProvider(vi.fn());

    expect(provider.from).toBe('Sign in <onboarding@resend.dev>');
  });

  it('delivers the sign-in link through the injected sendEmail', async () => {
    const sendEmail = vi.fn().mockResolvedValue(undefined);
    const provider = buildMagicLinkProvider(sendEmail);

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

    expect(sendEmail).toHaveBeenCalledWith({
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
    const sendEmail = vi.fn().mockResolvedValue(undefined);
    const provider = buildMagicLinkProvider(sendEmail);

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
    expect(sendEmail).toHaveBeenCalledWith({
      to: 'invited@example.com',
      from: 'Sign in <onboarding@resend.dev>',
      subject: "You've been invited to manage Acme Blog",
      html: expect.stringContaining('<strong>Acme Blog</strong>'),
    });
  });

  it('falls back to the generic copy and still delivers when the invite lookup throws', async () => {
    findPendingInviteByEmailMock.mockRejectedValue(new Error('db error'));
    const sendEmail = vi.fn().mockResolvedValue(undefined);
    const provider = buildMagicLinkProvider(sendEmail);

    await provider.sendVerificationRequest({
      identifier: 'jane@example.com',
      url: 'https://example.com/api/auth/callback/email?token=abc',
      expires: new Date('2026-01-01T00:00:00.000Z'),
      provider,
      token: 'abc',
      theme: {},
      request: new Request('https://example.com'),
    });

    expect(sendEmail).toHaveBeenCalledWith({
      to: 'jane@example.com',
      from: 'Sign in <onboarding@resend.dev>',
      subject: 'Sign in to example.com',
      html: expect.stringContaining(
        'href="https://example.com/api/auth/callback/email?token=abc"',
      ),
    });
  });
});
