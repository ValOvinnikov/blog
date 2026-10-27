import { faker } from '@faker-js/faker';

import { normalizeEmail } from './normalize-email';

faker.seed(6029);

const MOCK_LOCAL_PART = faker.internet.username().toLowerCase();
const MOCK_DOMAIN = faker.internet.domainName();
const MOCK_TAG = faker.lorem.word();
const MOCK_ADDRESS = `${MOCK_LOCAL_PART}@${MOCK_DOMAIN}`;
const MOCK_TAGGED_ADDRESS = `${MOCK_LOCAL_PART}+${MOCK_TAG}@${MOCK_DOMAIN}`;

describe(normalizeEmail, () => {
  it.each([
    ['trims surrounding whitespace', `  ${MOCK_ADDRESS}  `, MOCK_ADDRESS],
    ['lower-cases the address', MOCK_ADDRESS.toUpperCase(), MOCK_ADDRESS],
    ['keeps a +tag', MOCK_TAGGED_ADDRESS.toUpperCase(), MOCK_TAGGED_ADDRESS],
    ['leaves a normalised address alone', MOCK_ADDRESS, MOCK_ADDRESS],
  ])('%s', (_label, email, expected) => {
    expect(normalizeEmail(email)).toBe(expected);
  });
});
