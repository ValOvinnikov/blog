import { makeRawTagWithPostCount } from '@blog/service/testing/entities/fixtures';

import { tagsQuery } from './query';

describe('tagsQuery', () => {
  it('parses a tag with a post count', () => {
    const raw = [makeRawTagWithPostCount({ postCount: 5 })];

    expect(() => tagsQuery.parse(raw)).not.toThrow();
  });

  it('correlates the post count to the enclosing tag document', () => {
    expect(tagsQuery.query).toContain('references(^._id)');
  });

  it('excludes future-dated posts from the post count', () => {
    expect(tagsQuery.query).toContain('publishedAt <= now()');
  });

  it('counts only blog posts', () => {
    expect(tagsQuery.query).toContain('_type == "blog_post"');
  });
});
