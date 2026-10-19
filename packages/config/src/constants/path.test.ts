import { DOMAIN_LABEL_PATTERN, DOMAIN_PATTERN } from './path';

describe('DOMAIN_PATTERN', () => {
  it('matches a valid domain', () => {
    expect(DOMAIN_PATTERN.test('acme.com')).toBe(true);
  });

  it('rejects a scheme-prefixed value', () => {
    expect(DOMAIN_PATTERN.test('https://acme.com')).toBe(false);
  });

  it('rejects a trailing-slash value', () => {
    expect(DOMAIN_PATTERN.test('acme.com/')).toBe(false);
  });

  it('rejects a whitespace-padded value', () => {
    expect(DOMAIN_PATTERN.test(' acme.com ')).toBe(false);
  });

  it('rejects a single label', () => {
    expect(DOMAIN_PATTERN.test('acme')).toBe(false);
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
