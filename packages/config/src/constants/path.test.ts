import { DOMAIN_PATTERN, SLUG_PATTERN } from './path';

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

describe('SLUG_PATTERN', () => {
  it('matches a lowercase-alphanumeric-hyphen slug', () => {
    expect(SLUG_PATTERN.test('my-tenant-slug')).toBe(true);
  });

  it('rejects an uppercase value', () => {
    expect(SLUG_PATTERN.test('My-Tenant')).toBe(false);
  });
});
