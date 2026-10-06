import { indexPageParamsQuery } from './query';

describe('indexPageParamsQuery', () => {
  it('parses the blog page total post count and its module ids', () => {
    const raw = { blogPosts: { total: 12 }, moduleRefs: [{ _ref: 'list-1' }] };

    expect(() => indexPageParamsQuery.parse(raw)).not.toThrow();
  });

  it('parses a blog page with no modules', () => {
    const raw = { blogPosts: { total: 12 }, moduleRefs: null };

    expect(() => indexPageParamsQuery.parse(raw)).not.toThrow();
  });

  it('excludes future-dated posts from the total post count', () => {
    expect(indexPageParamsQuery.query).toContain('publishedAt <= now()');
  });
});
