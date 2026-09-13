import { indexPageParamsQuery } from './query';

describe('indexPageParamsQuery', () => {
  it('parses the blog page total post count and the first list module pageSize', () => {
    const raw = { blogPosts: { total: 12 }, pageSize: 9 };

    expect(() => indexPageParamsQuery.parse(raw)).not.toThrow();
  });

  it('parses a blog page with no module_postList entry in modules[]', () => {
    const raw = { blogPosts: { total: 12 }, pageSize: null };

    expect(() => indexPageParamsQuery.parse(raw)).not.toThrow();
  });

  it('excludes future-dated posts from the total post count', () => {
    expect(indexPageParamsQuery.query).toContain('publishedAt <= now()');
  });

  it('projects pageSize from the first module_postList entry in modules[], not the retired postList reference', () => {
    expect(indexPageParamsQuery.query).toContain(
      'modules[]->[_type == "module_postList"][0].pageSize',
    );
    expect(indexPageParamsQuery.query).not.toContain('"postList"');
  });
});
