import { hashSha256Hex } from './hash-sha256';

describe(hashSha256Hex, () => {
  it('returns the hex SHA-256 digest of the value', () => {
    expect(hashSha256Hex('hello')).toBe(
      '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
    );
  });
});
