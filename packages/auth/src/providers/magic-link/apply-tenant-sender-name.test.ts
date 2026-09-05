import { applyTenantSenderName } from './apply-tenant-sender-name';

describe(applyTenantSenderName, () => {
  it('returns the from address unchanged when no sender name is given', () => {
    expect(
      applyTenantSenderName('Sign in <onboarding@resend.dev>', undefined),
    ).toBe('Sign in <onboarding@resend.dev>');
  });

  it('overrides the display name, keeping the configured address', () => {
    expect(
      applyTenantSenderName(
        'Sign in <sign-in@mail.valstack.dev>',
        'Acme Support',
      ),
    ).toBe('Acme Support <sign-in@mail.valstack.dev>');
  });

  it('overrides the display name on the default Resend testing sender', () => {
    expect(
      applyTenantSenderName('Sign in <onboarding@resend.dev>', 'Acme Support'),
    ).toBe('Acme Support <onboarding@resend.dev>');
  });

  it('strips angle brackets and newlines from the sender name to avoid header injection', () => {
    expect(
      applyTenantSenderName(
        'Sign in <onboarding@resend.dev>',
        'Acme <evil@attacker.example>\r\nBcc: victim@example.com',
      ),
    ).toBe(
      'Acme evil@attacker.exampleBcc: victim@example.com <onboarding@resend.dev>',
    );
  });

  it('falls back to the original from address when the sanitized sender name is empty', () => {
    expect(applyTenantSenderName('Sign in <onboarding@resend.dev>', '<>')).toBe(
      'Sign in <onboarding@resend.dev>',
    );
  });
});
