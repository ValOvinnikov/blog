import {
  MOCK_FROM_ADDRESS,
  MOCK_SENDER_FROM_ADDRESS,
  MOCK_SENDER_NAME,
  MOCK_VERIFIED_DOMAIN_FROM_ADDRESS,
} from '@blog/auth/testing/magic-link-fixtures';

import { applyTenantSenderName } from './apply-tenant-sender-name';

describe(applyTenantSenderName, () => {
  it('returns the from address unchanged when no sender name is given', () => {
    expect(applyTenantSenderName(MOCK_FROM_ADDRESS, undefined)).toBe(
      MOCK_FROM_ADDRESS,
    );
  });

  it('overrides the display name, keeping the configured address', () => {
    expect(
      applyTenantSenderName(
        MOCK_VERIFIED_DOMAIN_FROM_ADDRESS,
        MOCK_SENDER_NAME,
      ),
    ).toBe('Acme Support <sign-in@mail.valstack.dev>');
  });

  it('overrides the display name on the default Resend testing sender', () => {
    expect(applyTenantSenderName(MOCK_FROM_ADDRESS, MOCK_SENDER_NAME)).toBe(
      MOCK_SENDER_FROM_ADDRESS,
    );
  });

  it('strips angle brackets and newlines from the sender name to avoid header injection', () => {
    expect(
      applyTenantSenderName(
        MOCK_FROM_ADDRESS,
        'Acme <evil@attacker.example>\r\nBcc: victim@example.com',
      ),
    ).toBe(
      'Acme evil@attacker.exampleBcc: victim@example.com <onboarding@resend.dev>',
    );
  });

  it('falls back to the original from address when the sanitized sender name is empty', () => {
    expect(applyTenantSenderName(MOCK_FROM_ADDRESS, '<>')).toBe(
      MOCK_FROM_ADDRESS,
    );
  });
});
