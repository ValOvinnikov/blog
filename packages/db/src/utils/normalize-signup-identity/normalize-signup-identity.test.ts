import {
  MOCK_BLOCKED_ADDRESS,
  MOCK_BLOCKED_ADDRESS_DOMAIN,
  MOCK_NOT_A_DOMAIN,
} from '@blog/db/testing/blocked-signup-identities/fixtures';

import {
  normalizeSignupDomain,
  normalizeSignupEmail,
} from './normalize-signup-identity';

describe(normalizeSignupEmail, () => {
  it.each([
    ['lower-cases and trims', '  Blocked@Example.COM '],
    ['drops a +tag from', 'blocked+promo+2@example.com'],
  ])('%s the address', (_, email) => {
    expect(normalizeSignupEmail(email)).toEqual({
      address: MOCK_BLOCKED_ADDRESS,
      domain: MOCK_BLOCKED_ADDRESS_DOMAIN,
    });
  });

  it.each([
    ['no @', 'blocked.example.com'],
    ['an empty local part', '@example.com'],
    ['a local part that is only a tag', '+promo@example.com'],
    ['an invalid domain', 'blocked@not a domain'],
  ])('rejects an address with %s', (_, email) => {
    expect(normalizeSignupEmail(email)).toBeUndefined();
  });
});

describe(normalizeSignupDomain, () => {
  it('lower-cases and trims the domain', () => {
    expect(normalizeSignupDomain(' Example.COM ')).toBe(
      MOCK_BLOCKED_ADDRESS_DOMAIN,
    );
  });

  it('rejects a value that is not a domain', () => {
    expect(normalizeSignupDomain(MOCK_NOT_A_DOMAIN)).toBeUndefined();
  });
});
