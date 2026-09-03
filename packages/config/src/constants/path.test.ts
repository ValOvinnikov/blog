import { DOMAIN_PATTERN } from './path';

describe('DOMAIN_PATTERN', () => {
  it('matches a valid domain', () => {
    expect(DOMAIN_PATTERN.test('acme.com')).toBe(true);
  });

  it('rejects a scheme-prefixed value', () => {
    expect(DOMAIN_PATTERN.test('https://acme.com')).toBe(false);
  });

  it('rejects a trailing-slash value', () => {
    expect(DOMAIN_PATTERN.test('acme.com/')).toBe(false);
  });

  it('rejects a whitespace-padded value', () => {
    expect(DOMAIN_PATTERN.test(' acme.com ')).toBe(false);
  });
});
