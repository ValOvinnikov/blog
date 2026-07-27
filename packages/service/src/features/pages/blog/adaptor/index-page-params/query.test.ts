import { indexPageParamsQuery } from './query';

describe('indexPageParamsQuery', () => {
  it('parses the blog page total post count and itemsPerPage', () => {
    const raw = { blogPosts: { total: 12 }, itemsPerPage: 9 };

    expect(() => indexPageParamsQuery.parse(raw)).not.toThrow();
  });

  it('excludes future-dated posts from the total post count', () => {
    expect(indexPageParamsQuery.query).toContain('publishedAt <= now()');
  });
});
