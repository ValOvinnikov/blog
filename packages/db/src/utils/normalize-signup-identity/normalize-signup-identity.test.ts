import {
  hashSignupAddress,
  normalizeSignupDomain,
  normalizeSignupEmail,
} from './normalize-signup-identity';

const ADDRESS = 'ada@example.com';
const DOMAIN = 'example.com';

describe(normalizeSignupEmail, () => {
  it('lower-cases and trims the address', () => {
    expect(normalizeSignupEmail('  Ada@Example.COM ')).toEqual({
      address: ADDRESS,
      domain: DOMAIN,
    });
  });

  it('drops a +tag from the local part', () => {
    expect(normalizeSignupEmail('ada+promo+2@example.com')).toEqual({
      address: ADDRESS,
      domain: DOMAIN,
    });
  });

  it.each([
    ['no @', 'ada.example.com'],
    ['an empty local part', '@example.com'],
    ['a local part that is only a tag', '+promo@example.com'],
    ['an invalid domain', 'ada@not a domain'],
  ])('rejects an address with %s', (_, email) => {
    expect(normalizeSignupEmail(email)).toBeUndefined();
  });
});

describe(normalizeSignupDomain, () => {
  it('lower-cases and trims the domain', () => {
    expect(normalizeSignupDomain(' Example.COM ')).toBe(DOMAIN);
  });

  it('rejects a value that is not a domain', () => {
    expect(normalizeSignupDomain('https://example.com')).toBeUndefined();
  });
});

describe(hashSignupAddress, () => {
  it('returns the SHA-256 hex digest of the address', async () => {
    const hash = await hashSignupAddress(ADDRESS);

    expect(hash).toBe(
      'b5fc85e55755f9e0d030a10ab4429b6b2944855f9a0d60077fe832becbc41d72',
    );
  });
});
