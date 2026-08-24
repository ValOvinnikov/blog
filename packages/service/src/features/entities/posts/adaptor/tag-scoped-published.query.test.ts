import { makeRawFeedPost } from '@blog/service/testing/entities/fixtures';

import { tagScopedPublishedPostsQuery } from './tag-scoped-published.query';

describe('tagScopedPublishedPostsQuery', () => {
  it('parses a feed post', () => {
    const raw = [makeRawFeedPost()];

    expect(() => tagScopedPublishedPostsQuery.parse(raw)).not.toThrow();
  });

  it('filters by blog_post type', () => {
    expect(tagScopedPublishedPostsQuery.query).toContain(
      '_type == "blog_post"',
    );
  });

  it('excludes posts whose publishedAt is in the future', () => {
    expect(tagScopedPublishedPostsQuery.query).toContain(
      'publishedAt <= now()',
    );
  });

  it('orders newest first, same as the site-wide feed query', () => {
    expect(tagScopedPublishedPostsQuery.query).toContain(
      'order(publishedAt desc)',
    );
  });

  it('scopes to the given tag id by reference identity', () => {
    expect(tagScopedPublishedPostsQuery.query).toContain('references($tagId)');
  });

  it('does not deref author or an image asset', () => {
    expect(tagScopedPublishedPostsQuery.query).not.toContain('author');
    expect(tagScopedPublishedPostsQuery.query).not.toContain('heroImage');
    expect(tagScopedPublishedPostsQuery.query).not.toContain('topic');
    expect(tagScopedPublishedPostsQuery.query).not.toContain('wordCount');
  });
});
