import { postListModulePostsQuery } from './posts.query';

describe('postListModulePostsQuery', () => {
  it('limits the posts to the given count in GROQ (end-exclusive slice)', () => {
    // The whole point of the fix: Sanity must return at most `limit` posts,
    // not the entire collection sliced in JS.
    expect(postListModulePostsQuery(3).query).toContain('[0...3]');
    expect(postListModulePostsQuery(6).query).toContain('[0...6]');
  });

  it('orders by newest first', () => {
    expect(postListModulePostsQuery(3).query).toContain(
      'order(publishedAt desc)',
    );
  });
});
