import { isValidEmail } from './is-valid-email';

describe('isValidEmail', () => {
  it.each([
    'reader@example.com',
    'reader.name+tag@example.co.uk',
    '  reader@example.com  ',
  ])('accepts %s', (email) => {
    expect(isValidEmail(email)).toBe(true);
  });

  it.each([
    'not-an-email',
    'missing-domain@',
    '@missing-local.com',
    'no-at-sign.com',
    '',
    'spaces in@email.com',
  ])('rejects %s', (email) => {
    expect(isValidEmail(email)).toBe(false);
  });
});
