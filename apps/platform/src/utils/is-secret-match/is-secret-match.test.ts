import { isSecretMatch } from './is-secret-match';

describe(isSecretMatch, () => {
  it('returns true when the provided secret matches exactly', () => {
    expect(isSecretMatch('test-secret', 'test-secret')).toBe(true);
  });

  it('returns false when the provided secret does not match', () => {
    expect(isSecretMatch('wrong-secret', 'test-secret')).toBe(false);
  });

  it('returns false when the provided secret is null', () => {
    expect(isSecretMatch(null, 'test-secret')).toBe(false);
  });

  it('returns false when the provided secret is an empty string', () => {
    expect(isSecretMatch('', 'test-secret')).toBe(false);
  });

  it('returns false when the provided secret has a different length', () => {
    expect(isSecretMatch('short', 'a-much-longer-secret')).toBe(false);
  });
});
