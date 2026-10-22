import { normalizeEmail } from './normalize-email';

const ADDRESS = 'foo@example.com';
const MIXED_CASE_ADDRESS = 'Foo@Example.com';

describe(normalizeEmail, () => {
  it('trims surrounding whitespace', () => {
    expect(normalizeEmail(`  ${ADDRESS}  `)).toBe(ADDRESS);
  });

  it('lower-cases the address', () => {
    expect(normalizeEmail(MIXED_CASE_ADDRESS)).toBe(ADDRESS);
  });

  it('trims and lower-cases together', () => {
    expect(normalizeEmail(`  ${MIXED_CASE_ADDRESS} `)).toBe(ADDRESS);
  });

  it('keeps a +tag in the local part', () => {
    expect(normalizeEmail('Foo+News@Example.com')).toBe('foo+news@example.com');
  });

  it('is a no-op for an already-normalized address', () => {
    expect(normalizeEmail(ADDRESS)).toBe(ADDRESS);
  });
});
