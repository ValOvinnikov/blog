import { resolveMagicLinkFromAddress } from './magic-link-from-address';

describe(resolveMagicLinkFromAddress, () => {
  it('falls back to the Resend shared testing sender when unset', () => {
    expect(resolveMagicLinkFromAddress(undefined)).toBe(
      'Sign in <onboarding@resend.dev>',
    );
  });

  it('uses the configured address when set', () => {
    expect(
      resolveMagicLinkFromAddress('Sign in <sign-in@mail.valstack.dev>'),
    ).toBe('Sign in <sign-in@mail.valstack.dev>');
  });
});
