import { buildMagicLinkProvider } from './magic-link-provider';

describe(buildMagicLinkProvider, () => {
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
});
