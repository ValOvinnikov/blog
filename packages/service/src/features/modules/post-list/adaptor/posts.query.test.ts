import { TAXONOMY_KIND } from '@blog/config';

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

  it('scopes posts to a tag with a single direct lookup', () => {
    const query = postListModulePaginatedPostsQuery(1, 9, {
      kind: TAXONOMY_KIND.TAGS,
      slug: 'engineering',
    }).query;

    expect(query).toContain(
      'references(*[_type == "blog_tag" && slug.current == $scopeSlug][0]._id)',
    );
    expect(query).not.toContain('blog_topic');
  });

  it('scopes posts to a topic with a single direct lookup', () => {
    const query = postListModulePaginatedPostsQuery(1, 9, {
      kind: TAXONOMY_KIND.TOPICS,
      slug: 'news',
    }).query;

    expect(query).toContain(
      'references(*[_type == "blog_topic" && slug.current == $scopeSlug][0]._id)',
    );
    expect(query).not.toContain('blog_tag');
  });

  it('omits the scope predicate entirely when unscoped', () => {
    const query = postListModulePaginatedPostsQuery(1, 9).query;

    expect(query).not.toContain('references(');
    expect(query).not.toContain('$scopeSlug');
    expect(query).not.toContain('blog_tag');
    expect(query).not.toContain('blog_topic');
  });
});
