import { postLatestModulePostsQuery } from './posts.query';

describe('postLatestModulePostsQuery', () => {
  it('limits the posts to the given count in GROQ (end-exclusive slice)', () => {
    expect(postLatestModulePostsQuery(3).query).toContain('[0...3]');
    expect(postLatestModulePostsQuery(6).query).toContain('[0...6]');
  });

  it('orders by newest first', () => {
    expect(postLatestModulePostsQuery(3).query).toContain(
      'order(publishedAt desc)',
    );
  });

  it('excludes posts whose publishedAt is in the future', () => {
    expect(postLatestModulePostsQuery(3).query).toContain(
      'publishedAt <= now()',
    );
  });

  it('filters to blog_post documents only', () => {
    expect(postLatestModulePostsQuery(3).query).toContain(
      '_type == "blog_post"',
    );
  });
});
