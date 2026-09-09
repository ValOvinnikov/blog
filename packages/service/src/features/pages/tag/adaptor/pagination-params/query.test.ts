import { tagPaginationParamsQuery } from './query';

describe('tagPaginationParamsQuery', () => {
  it('parses a tag page slug with a list module page size and a post count', () => {
    const raw = [{ slug: 'typescript', pageSize: 9, postCount: 5 }];

    expect(() => tagPaginationParamsQuery.parse(raw)).not.toThrow();
  });

  it('parses a tag page with no list module in modules[] and zero posts', () => {
    const raw = [{ slug: 'empty', pageSize: null, postCount: 0 }];

    expect(() => tagPaginationParamsQuery.parse(raw)).not.toThrow();
  });

  it('excludes future-dated posts from the post count', () => {
    expect(tagPaginationParamsQuery.query).toContain('publishedAt <= now()');
  });

  it('correlates the post count to the enclosing tag page by reference', () => {
    expect(tagPaginationParamsQuery.query).toContain('references(^.tag._ref)');
  });
});
