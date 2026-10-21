import {
  BLOCKED_ADDRESS,
  BLOCKED_ADDRESS_DOMAIN,
  NOT_A_DOMAIN,
} from '@blog/db/testing/blocked-signup-identities/fixtures';

import {
  normalizeSignupDomain,
  normalizeSignupEmail,
} from './normalize-signup-identity';

describe(normalizeSignupEmail, () => {
  it('lower-cases and trims the address', () => {
    expect(normalizeSignupEmail('  Blocked@Example.COM ')).toEqual({
      address: BLOCKED_ADDRESS,
      domain: BLOCKED_ADDRESS_DOMAIN,
    });
  });

  it('drops a +tag from the local part', () => {
    expect(normalizeSignupEmail('blocked+promo+2@example.com')).toEqual({
      address: BLOCKED_ADDRESS,
      domain: BLOCKED_ADDRESS_DOMAIN,
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
    expect(normalizeSignupDomain(' Example.COM ')).toBe(BLOCKED_ADDRESS_DOMAIN);
  });

  it('rejects a value that is not a domain', () => {
    expect(normalizeSignupDomain(NOT_A_DOMAIN)).toBeUndefined();
  });
});
