import { hashToken } from './hash-token';

const TOKEN = 'reader-token';

describe(hashToken, () => {
  it('returns the hex SHA-256 digest of the token', () => {
    expect(hashToken('newsletter-link')).toBe(
      'dadffd5836bd8c25630bbf9fafd7bfe97c17a5e3649769997cc80c6d6c365699',
    );
  });

  it('never returns the token itself', () => {
    expect(hashToken(TOKEN)).not.toContain(TOKEN);
  });
});
