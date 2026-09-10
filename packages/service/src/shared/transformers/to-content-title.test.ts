import { toContentTitle } from './to-content-title';

describe(toContentTitle, () => {
  it('returns the authored heading when present', () => {
    expect(toContentTitle('Latest from the blog', 'Acme')).toBe(
      'Latest from the blog',
    );
  });

  it('falls back to the brand name when heading is undefined', () => {
    expect(toContentTitle(undefined, 'Acme')).toBe('Acme');
  });

  it('falls back to the brand name when heading is an empty string', () => {
    expect(toContentTitle('', 'Acme')).toBe('Acme');
  });

  it('falls back to the brand name when heading is whitespace-only', () => {
    expect(toContentTitle('   ', 'Acme')).toBe('Acme');
  });
});
