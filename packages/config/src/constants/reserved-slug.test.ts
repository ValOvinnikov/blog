import { RESERVED_SLUGS } from './reserved-slug';

// Coverage asserting `apps/web`'s actual static routes stay a subset of this
// list lives in `apps/web` itself (config must not import from an app) — see
// issue #591.
describe('RESERVED_SLUGS', () => {
  it('is a non-empty list of strings', () => {
    expect(RESERVED_SLUGS.length).toBeGreaterThan(0);
    RESERVED_SLUGS.forEach((slug) => {
      expect(typeof slug).toBe('string');
    });
  });

  it('contains every top-level static segment claimed by apps/web', () => {
    expect(RESERVED_SLUGS).toContain('blog');
    expect(RESERVED_SLUGS).toContain('category');
    expect(RESERVED_SLUGS).toContain('tag');
    expect(RESERVED_SLUGS).toContain('author');
    expect(RESERVED_SLUGS).toContain('api');
    expect(RESERVED_SLUGS).toContain('page');
  });
});
