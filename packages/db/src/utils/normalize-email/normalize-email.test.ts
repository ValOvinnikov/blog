import { normalizeEmail } from './normalize-email';

describe(normalizeEmail, () => {
  it('trims surrounding whitespace', () => {
    expect(normalizeEmail('  foo@example.com  ')).toBe('foo@example.com');
  });

  it('lower-cases the address', () => {
    expect(normalizeEmail('Foo@Example.com')).toBe('foo@example.com');
  });

  it('trims and lower-cases together', () => {
    expect(normalizeEmail('  Foo@Example.com ')).toBe('foo@example.com');
  });

  it('is a no-op for an already-normalized address', () => {
    expect(normalizeEmail('foo@example.com')).toBe('foo@example.com');
  });
});
