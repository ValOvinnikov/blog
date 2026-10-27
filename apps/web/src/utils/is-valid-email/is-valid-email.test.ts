import { faker } from '@faker-js/faker';

import { isValidEmail } from './is-valid-email';

faker.seed(121);

const MOCK_LOCAL = faker.internet.username().replace(/[^a-z0-9]/gi, '');
const MOCK_TAG = faker.lorem.word();
const MOCK_DOMAIN = faker.internet.domainName();
const MOCK_SUBDOMAIN_DOMAIN = `mail.${MOCK_DOMAIN}`;
const MOCK_EMAIL = faker.internet.email();
const ADVERSARIAL_REPEATS = 20000;

describe(isValidEmail, () => {
  it.each([
    { case: 'a plain address', email: MOCK_EMAIL },
    {
      case: 'a tagged address',
      email: `${MOCK_LOCAL}+${MOCK_TAG}@${MOCK_DOMAIN}`,
    },
    {
      case: 'a subdomain address',
      email: `${MOCK_LOCAL}@${MOCK_SUBDOMAIN_DOMAIN}`,
    },
    { case: 'an address padded with whitespace', email: `  ${MOCK_EMAIL}  ` },
  ])('accepts $case', ({ email }) => {
    expect(isValidEmail(email)).toBe(true);
  });

  it.each([
    { case: 'text without an at sign', email: MOCK_LOCAL },
    { case: 'a domain-less address', email: `${MOCK_LOCAL}@` },
    { case: 'a local-part-less address', email: `@${MOCK_DOMAIN}` },
    { case: 'a dotted domain with no at sign', email: MOCK_DOMAIN },
    { case: 'an empty string', email: '' },
    {
      case: 'whitespace in the local part',
      email: `${MOCK_LOCAL} ${MOCK_TAG}@${MOCK_DOMAIN}`,
    },
    {
      case: 'whitespace in the domain',
      email: `${MOCK_LOCAL}@${MOCK_TAG} .com`,
    },
    { case: 'a doubled at sign', email: `${MOCK_LOCAL}@@${MOCK_DOMAIN}` },
    { case: 'two addresses', email: `${MOCK_EMAIL}@${MOCK_DOMAIN}` },
    { case: 'a dotless domain', email: `${MOCK_LOCAL}@${MOCK_TAG}` },
    {
      case: 'a domain starting with a dot',
      email: `${MOCK_LOCAL}@.${MOCK_TAG}`,
    },
    { case: 'a domain ending with a dot', email: `${MOCK_LOCAL}@${MOCK_TAG}.` },
    { case: 'a domain that is only a dot', email: `${MOCK_LOCAL}@.` },
  ])('rejects $case', ({ email }) => {
    expect(isValidEmail(email)).toBe(false);
  });

  it('rejects adversarial input without catastrophic backtracking', () => {
    const adversarial = `!@${'!.'.repeat(ADVERSARIAL_REPEATS)}@`;

    expect(isValidEmail(adversarial)).toBe(false);
  });
});
