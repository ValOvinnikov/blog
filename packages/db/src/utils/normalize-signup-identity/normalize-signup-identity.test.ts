import {
  MOCK_BLOCKED_ADDRESS,
  MOCK_BLOCKED_ADDRESS_DOMAIN,
  MOCK_NOT_A_DOMAIN,
} from '@blog/db/testing/blocked-signup-identities/fixtures';

import {
  normalizeSignupDomain,
  normalizeSignupEmail,
} from './normalize-signup-identity';

const MOCK_TAG = '+promo';
const [MOCK_LOCAL_PART = ''] = MOCK_BLOCKED_ADDRESS.split('@');

describe(normalizeSignupEmail, () => {
  it.each([
    ['lower-cases and trims', ` ${MOCK_BLOCKED_ADDRESS.toUpperCase()} `],
    [
      'drops a +tag from',
      `${MOCK_LOCAL_PART}${MOCK_TAG}${MOCK_TAG}@${MOCK_BLOCKED_ADDRESS_DOMAIN}`,
    ],
  ])('%s the address', (_, email) => {
    expect(normalizeSignupEmail(email)).toEqual({
      address: MOCK_BLOCKED_ADDRESS,
      domain: MOCK_BLOCKED_ADDRESS_DOMAIN,
    });
  });

  it.each([
    ['no @', `${MOCK_LOCAL_PART}.${MOCK_BLOCKED_ADDRESS_DOMAIN}`],
    ['an empty local part', `@${MOCK_BLOCKED_ADDRESS_DOMAIN}`],
    [
      'a local part that is only a tag',
      `${MOCK_TAG}@${MOCK_BLOCKED_ADDRESS_DOMAIN}`,
    ],
    ['an invalid domain', `${MOCK_LOCAL_PART}@${MOCK_NOT_A_DOMAIN}`],
  ])('rejects an address with %s', (_, email) => {
    expect(normalizeSignupEmail(email)).toBeUndefined();
  });
});

describe(normalizeSignupDomain, () => {
  it('lower-cases and trims the domain', () => {
    expect(
      normalizeSignupDomain(` ${MOCK_BLOCKED_ADDRESS_DOMAIN.toUpperCase()} `),
    ).toBe(MOCK_BLOCKED_ADDRESS_DOMAIN);
  });

  it('rejects a value that is not a domain', () => {
    expect(normalizeSignupDomain(MOCK_NOT_A_DOMAIN)).toBeUndefined();
  });
});
