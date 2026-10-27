import { faker } from '@faker-js/faker';

import { isValidDomain } from './is-valid-domain';

faker.seed(4471);

const MOCK_DOMAIN = faker.internet.domainName();

describe(isValidDomain, () => {
  it('accepts a plain lowercase domain', () => {
    expect(isValidDomain(MOCK_DOMAIN)).toBe(true);
  });

  it.each([
    ['a scheme-prefixed value', `https://${MOCK_DOMAIN}`],
    ['a trailing-slash value', `${MOCK_DOMAIN}/`],
    ['a value with surrounding whitespace', ` ${MOCK_DOMAIN} `],
  ])('rejects %s', (_, value) => {
    expect(isValidDomain(value)).toBe(false);
  });
});
