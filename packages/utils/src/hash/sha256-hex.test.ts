import { sha256Hex } from './sha256-hex';

describe(sha256Hex, () => {
  it('returns the lower-case hex SHA-256 digest of the value', () => {
    expect(sha256Hex('a value to hash')).toBe(
      'ae10e91960c6a5252c356249a626efd0364768ebe7462251030b52c73eb18327',
    );
  });
});
