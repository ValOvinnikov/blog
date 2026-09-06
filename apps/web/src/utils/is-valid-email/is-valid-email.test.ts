import { isValidEmail } from './is-valid-email';

describe('isValidEmail', () => {
  it.each([
    'reader@example.com',
    'reader.name+tag@example.co.uk',
    'reader+tag@mail.example.com',
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
    'reader@example .com',
    'reader@@example.com',
    'reader@example.com@example.com',
    'reader@localhost',
    'reader@.com',
    'reader@com.',
    'reader@.',
  ])('rejects %s', (email) => {
    expect(isValidEmail(email)).toBe(false);
  });

  it('completes within a small time budget on adversarial input that would catastrophically backtrack a naive regex', () => {
    const n = 20000;
    const adversarial = `!@${'!.'.repeat(n)}@`;

    const start = performance.now();
    const result = isValidEmail(adversarial);
    const elapsedMs = performance.now() - start;

    expect(result).toBe(false);
    expect(elapsedMs).toBeLessThan(500);
  });
});
