import { isValidEmailAddress } from './is-valid-email-address';

describe('isValidEmailAddress', () => {
  const cases: Array<[string, boolean]> = [
    ['editor@example.com', true],
    ['reader+tag@mail.example.com', true],
    ['a@b.c', true],
    ['a.b@c.d', true],
    ['user@a..b', true],
    ['not-an-email', false],
    ['someone@localhost', false],
    ['some one@example.com', false],
    ['', false],
    ['@example.com', false],
    ['user@', false],
    ['user@example', false],
    ['user@.com', false],
    ['user@com.', false],
    ['a@b@c.com', false],
    ['user@examp le.com', false],
  ];

  it.each(cases)('evaluates %s as %s', (value, expected) => {
    expect(isValidEmailAddress(value)).toBe(expected);
  });

  it('does not backtrack polynomially on adversarial input', () => {
    const adversarialInput = `!@${'!.'.repeat(50000)} `;

    const start = performance.now();
    const result = isValidEmailAddress(adversarialInput);
    const elapsed = performance.now() - start;

    expect(result).toBe(false);
    expect(elapsed).toBeLessThan(1000);
  });
});
