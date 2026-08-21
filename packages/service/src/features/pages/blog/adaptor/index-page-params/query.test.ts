import { indexPageParamsQuery } from './query';

describe('indexPageParamsQuery', () => {
  it('parses the blog page total post count and the archive pageSize', () => {
    const raw = { blogPosts: { total: 12 }, postList: { pageSize: 9 } };

    expect(() => indexPageParamsQuery.parse(raw)).not.toThrow();
  });

  it('parses a blog page with no postList slot set', () => {
    const raw = { blogPosts: { total: 12 }, postList: null };

    expect(() => indexPageParamsQuery.parse(raw)).not.toThrow();
  });

  it('excludes future-dated posts from the total post count', () => {
    expect(indexPageParamsQuery.query).toContain('publishedAt <= now()');
  });

  it('projects pageSize through the postList slot, not the retired itemsPerPage field', () => {
    expect(indexPageParamsQuery.query).toContain('pageSize');
    expect(indexPageParamsQuery.query).not.toContain('itemsPerPage');
  });
});
