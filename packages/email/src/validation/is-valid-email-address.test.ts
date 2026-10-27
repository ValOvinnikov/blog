import {
  MOCK_EMAIL_ADDRESS,
  MOCK_INVALID_EMAIL_ADDRESS,
} from '@blog/email/testing/email-fixtures';

import { isValidEmailAddress } from './is-valid-email-address';

describe(isValidEmailAddress, () => {
  it.each<[string, boolean]>([
    [MOCK_EMAIL_ADDRESS, true],
    ['reader+tag@mail.example.com', true],
    ['a@b.c', true],
    ['a.b@c.d', true],
    ['user@a..b', true],
    [MOCK_INVALID_EMAIL_ADDRESS, false],
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
  ])('evaluates %j as %s', (value, expected) => {
    expect(isValidEmailAddress(value)).toBe(expected);
  });

  it('rejects a 100,000-character adversarial input', () => {
    const adversarialInput = `!@${'!.'.repeat(50000)} `;

    expect(isValidEmailAddress(adversarialInput)).toBe(false);
  });
});
