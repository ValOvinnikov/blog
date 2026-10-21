import { hashToken } from './hash-token';

const TOKEN = 'reader-token';

describe(hashToken, () => {
  it('returns the hex SHA-256 digest of the token', () => {
    expect(hashToken('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('never returns the token itself', () => {
    expect(hashToken(TOKEN)).not.toContain(TOKEN);
  });
});
