import { isValidEmailAddress } from './is-valid-email-address';

describe('isValidEmailAddress', () => {
  it('accepts a well-formed address', () => {
    expect(isValidEmailAddress('editor@example.com')).toBe(true);
  });

  it('accepts an address with a subdomain and a plus tag', () => {
    expect(isValidEmailAddress('reader+tag@mail.example.com')).toBe(true);
  });

  it('rejects a value with no @', () => {
    expect(isValidEmailAddress('not-an-email')).toBe(false);
  });

  it('rejects a value with no domain dot', () => {
    expect(isValidEmailAddress('someone@localhost')).toBe(false);
  });

  it('rejects a value containing whitespace', () => {
    expect(isValidEmailAddress('some one@example.com')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isValidEmailAddress('')).toBe(false);
  });
});
