import { RESERVED_SLUGS } from './reserved-slug';

// Coverage asserting `apps/web`'s actual static routes stay a subset of this
// list lives in `apps/web` itself (config must not import from an app).
describe('RESERVED_SLUGS', () => {
  it('contains every top-level static segment claimed by apps/web', () => {
    expect(RESERVED_SLUGS).toContain('blog');
    expect(RESERVED_SLUGS).toContain('category');
    expect(RESERVED_SLUGS).toContain('tag');
    expect(RESERVED_SLUGS).toContain('author');
    expect(RESERVED_SLUGS).toContain('api');
    expect(RESERVED_SLUGS).toContain('page');
    expect(RESERVED_SLUGS).toContain('topics');
  });
});
