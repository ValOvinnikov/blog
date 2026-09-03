import { isValidDomain } from './is-valid-domain';

describe(isValidDomain, () => {
  it('accepts a plain lowercase domain', () => {
    expect(isValidDomain('acme.example.com')).toBe(true);
  });

  it('rejects a scheme-prefixed value', () => {
    expect(isValidDomain('https://acme.com')).toBe(false);
  });

  it('rejects a trailing-slash value', () => {
    expect(isValidDomain('acme.com/')).toBe(false);
  });

  it('rejects a value with surrounding whitespace', () => {
    expect(isValidDomain(' acme.com ')).toBe(false);
  });
});
