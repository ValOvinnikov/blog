import { faker } from '@faker-js/faker';

import { normalizeEmailIdentity } from './normalize-email-identity';

faker.seed(6029);

const MOCK_LOCAL_PART = faker.internet.username().toLowerCase();
const MOCK_DOMAIN = faker.internet.domainName();
const MOCK_ADDRESS = `${MOCK_LOCAL_PART}@${MOCK_DOMAIN}`;
const MOCK_PLUS_IN_DOMAIN = `${MOCK_LOCAL_PART}@ex+${MOCK_DOMAIN}`;
const MOCK_NOT_AN_ADDRESS = faker.lorem.slug();

describe(normalizeEmailIdentity, () => {
  it.each([
    [
      'lower-cases and trims an address',
      ` ${MOCK_ADDRESS.toUpperCase()} `,
      MOCK_ADDRESS,
    ],
    [
      'drops a +tag from the local part',
      `${MOCK_LOCAL_PART}+news+weekly@${MOCK_DOMAIN}`,
      MOCK_ADDRESS,
    ],
    [
      'keeps a + that sits in the domain',
      MOCK_PLUS_IN_DOMAIN,
      MOCK_PLUS_IN_DOMAIN,
    ],
    [
      'leaves an address without an @ lower-cased and trimmed',
      ` ${MOCK_NOT_AN_ADDRESS.toUpperCase()} `,
      MOCK_NOT_AN_ADDRESS,
    ],
  ])('%s', (_label, email, expected) => {
    expect(normalizeEmailIdentity(email)).toBe(expected);
  });
});
