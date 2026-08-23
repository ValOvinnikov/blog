import { tagPaginationParamsQuery } from './query';

describe('tagPaginationParamsQuery', () => {
  it('parses a tag page slug with a postList slot and a post count', () => {
    const raw = [
      { slug: 'typescript', postList: { pageSize: 9 }, postCount: 5 },
    ];

    expect(() => tagPaginationParamsQuery.parse(raw)).not.toThrow();
  });

  it('parses a tag page with no postList slot set and zero posts', () => {
    const raw = [{ slug: 'empty', postList: null, postCount: 0 }];

    expect(() => tagPaginationParamsQuery.parse(raw)).not.toThrow();
  });

  it('excludes future-dated posts from the post count', () => {
    expect(tagPaginationParamsQuery.query).toContain('publishedAt <= now()');
  });

  it('correlates the post count to the enclosing tag page by reference', () => {
    expect(tagPaginationParamsQuery.query).toContain('references(^.tag._ref)');
  });
});
