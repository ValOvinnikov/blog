import { makeRawFeedPost } from '@blog/service/testing/entities/fixtures';

import { allPublishedPostsQuery } from './query';

describe('allPublishedPostsQuery', () => {
  it('parses a feed post', () => {
    const raw = [makeRawFeedPost()];

    expect(() => allPublishedPostsQuery.parse(raw)).not.toThrow();
  });

  it('filters by page_post type', () => {
    expect(allPublishedPostsQuery.query).toContain('_type == "page_post"');
  });

  it('excludes posts whose publishedAt is in the future', () => {
    expect(allPublishedPostsQuery.query).toContain('publishedAt <= now()');
  });

  it('excludes posts whose absorbed content fields are not yet populated', () => {
    expect(allPublishedPostsQuery.query).toContain(
      'defined(excerpt) && defined(author) && defined(topic) && defined(body)',
    );
  });

  it('orders newest first, same as the paginated post-list query', () => {
    expect(allPublishedPostsQuery.query).toContain('order(publishedAt desc)');
  });

  it('does not deref author or an image asset', () => {
    expect(allPublishedPostsQuery.query).not.toContain('author->');
    expect(allPublishedPostsQuery.query).not.toContain('heroImage');
    expect(allPublishedPostsQuery.query).not.toContain('topic->');
    expect(allPublishedPostsQuery.query).not.toContain('wordCount');
  });
});
