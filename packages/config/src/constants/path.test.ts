import { faker } from '@faker-js/faker';

import { DOMAIN_LABEL_PATTERN, DOMAIN_PATTERN } from './path';

faker.seed(6028);

const MOCK_LABEL = faker.internet.domainWord();
const MOCK_DOMAIN = `${MOCK_LABEL}.com`;

describe('DOMAIN_PATTERN', () => {
  it('matches a valid domain', () => {
    expect(DOMAIN_PATTERN.test(MOCK_DOMAIN)).toBe(true);
  });

  it.each([
    ['scheme-prefixed', `https://${MOCK_DOMAIN}`],
    ['trailing-slash', `${MOCK_DOMAIN}/`],
    ['whitespace-padded', ` ${MOCK_DOMAIN} `],
    ['single-label', MOCK_LABEL],
  ])('rejects a %s value', (_kind, value) => {
    expect(DOMAIN_PATTERN.test(value)).toBe(false);
  });
});

describe('DOMAIN_LABEL_PATTERN', () => {
  it.each(['acme', 'a', 'acme-blog', '9lives', 'a'.repeat(63)])(
    'matches %s',
    (label) => {
      expect(DOMAIN_LABEL_PATTERN.test(label)).toBe(true);
    },
  );

  it.each([
    '',
    '-acme',
    'acme-',
    'Acme',
    'acme.blog',
    'acme_blog',
    'a'.repeat(64),
  ])('rejects %j', (label) => {
    expect(DOMAIN_LABEL_PATTERN.test(label)).toBe(false);
  });
});
