import { postListModulePaginatedPostsQuery } from './posts.query';

describe('postListModulePaginatedPostsQuery', () => {
  it('windows the first page by pageSize (end-exclusive slice)', () => {
    expect(postListModulePaginatedPostsQuery(1, 9).query).toContain('[0...9]');
  });

  it('windows a later page number by page/pageSize (end-exclusive slice)', () => {
    expect(postListModulePaginatedPostsQuery(2, 9).query).toContain('[9...18]');
    expect(postListModulePaginatedPostsQuery(3, 9).query).toContain(
      '[18...27]',
    );
  });

  it('orders by newest first', () => {
    expect(postListModulePaginatedPostsQuery(1, 9).query).toContain(
      'order(publishedAt desc)',
    );
  });

  it('excludes posts whose publishedAt is in the future', () => {
    expect(postListModulePaginatedPostsQuery(1, 9).query).toContain(
      'publishedAt <= now()',
    );
  });

  it('returns the total match count alongside the windowed posts', () => {
    expect(postListModulePaginatedPostsQuery(1, 9).query).toContain(
      '"total": count(',
    );
  });

  it('scopes posts to the enclosing page_tag when one references this module as its postList', () => {
    expect(postListModulePaginatedPostsQuery(1, 9).query).toContain(
      '*[_type == "page_tag" && postList._ref == $id][0].tag._ref',
    );
  });

  it('stays unscoped when no page_tag references this module', () => {
    expect(postListModulePaginatedPostsQuery(1, 9).query).toContain(
      '!defined(*[_type == "page_tag" && postList._ref == $id][0]._id)',
    );
  });

  it('scopes posts to the enclosing page_topic when one references this module as its postList', () => {
    expect(postListModulePaginatedPostsQuery(1, 9).query).toContain(
      '*[_type == "page_topic" && postList._ref == $id][0].topic._ref',
    );
  });

  it('stays unscoped when no page_topic references this module', () => {
    expect(postListModulePaginatedPostsQuery(1, 9).query).toContain(
      '!defined(*[_type == "page_topic" && postList._ref == $id][0]._id)',
    );
  });
});
