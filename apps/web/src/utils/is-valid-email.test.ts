import { isValidEmail } from './is-valid-email';

describe(isValidEmail, () => {
  it('accepts a well-formed email address', () => {
    expect(isValidEmail('reader@example.com')).toBe(true);
  });

  it('accepts an address with leading/trailing whitespace', () => {
    expect(isValidEmail('  reader@example.com  ')).toBe(true);
  });

  it('rejects an address with no @', () => {
    expect(isValidEmail('not-an-email')).toBe(false);
  });

  it('rejects an address with no domain', () => {
    expect(isValidEmail('reader@')).toBe(false);
  });

  it('rejects an address with no TLD', () => {
    expect(isValidEmail('reader@example')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isValidEmail('')).toBe(false);
  });

  it('rejects an address containing whitespace', () => {
    expect(isValidEmail('reader @example.com')).toBe(false);
  });
});
