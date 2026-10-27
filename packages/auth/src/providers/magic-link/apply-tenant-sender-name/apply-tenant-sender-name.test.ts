import {
  MOCK_COMMA_NAME,
  MOCK_FROM_ADDRESS,
  MOCK_FROM_EMAIL,
  MOCK_SENDER_NAME,
} from '@blog/auth/testing/magic-link-fixtures';

import { applyTenantSenderName } from './apply-tenant-sender-name';

const MOCK_INJECTED_SENDER_NAME =
  'Acme <evil@attacker.example>\r\nBcc: victim@example.com';
const MOCK_QUOTE_SENDER_NAME = 'Acme" evil@attacker.example \\';

describe(applyTenantSenderName, () => {
  it.each([
    ['no sender name', undefined],
    ['a sender name that sanitises to nothing', '<>'],
  ])('returns the from address unchanged for %s', (_, senderName) => {
    expect(applyTenantSenderName(MOCK_FROM_ADDRESS, senderName)).toBe(
      MOCK_FROM_ADDRESS,
    );
  });

  it('overrides the display name, keeping the configured address', () => {
    expect(applyTenantSenderName(MOCK_FROM_ADDRESS, MOCK_SENDER_NAME)).toBe(
      `"${MOCK_SENDER_NAME}" <${MOCK_FROM_EMAIL}>`,
    );
  });

  it('keeps a comma inside the quoted display name', () => {
    expect(applyTenantSenderName(MOCK_FROM_ADDRESS, MOCK_COMMA_NAME)).toBe(
      `"${MOCK_COMMA_NAME}" <${MOCK_FROM_EMAIL}>`,
    );
  });

  it('escapes quotes and backslashes so the name cannot close its quoted string', () => {
    expect(
      applyTenantSenderName(MOCK_FROM_ADDRESS, MOCK_QUOTE_SENDER_NAME),
    ).toBe(`"Acme\\" evil@attacker.example \\\\" <${MOCK_FROM_EMAIL}>`);
  });

  it('strips angle brackets and newlines from the sender name', () => {
    expect(
      applyTenantSenderName(MOCK_FROM_ADDRESS, MOCK_INJECTED_SENDER_NAME),
    ).toBe(
      `"Acme evil@attacker.exampleBcc: victim@example.com" <${MOCK_FROM_EMAIL}>`,
    );
  });
});
