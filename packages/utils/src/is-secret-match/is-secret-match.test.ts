import { faker } from '@faker-js/faker';

import { isSecretMatch } from './is-secret-match';

faker.seed(6029);

const MOCK_SECRET = faker.string.alphanumeric(32);
const MOCK_WRONG_SECRET = faker.string.alphanumeric(32);

describe(isSecretMatch, () => {
  it('accepts a secret that matches exactly', () => {
    expect(isSecretMatch(MOCK_SECRET, MOCK_SECRET)).toBe(true);
  });

  it.each([
    ['a different secret of the same length', MOCK_WRONG_SECRET],
    ['a longer secret that starts with the expected one', `${MOCK_SECRET}x`],
    ['null', null],
    ['an empty string', ''],
  ])('rejects %s', (_label, provided) => {
    expect(isSecretMatch(provided, MOCK_SECRET)).toBe(false);
  });
});
