import { makeRawBlogPage } from '@blog/service/testing/pages/fixtures';

import { blogPageQuery } from './query';

describe('blogPageQuery', () => {
  it('parses a blog page with no supporting text and no SEO', () => {
    const raw = makeRawBlogPage({ supportingText: null, seo: null });

    expect(() => blogPageQuery.parse(raw)).not.toThrow();
  });

  it('parses a blog page with no postList slot set', () => {
    const raw = makeRawBlogPage({ postList: null });

    expect(() => blogPageQuery.parse(raw)).not.toThrow();
  });

  it('projects the postList module id, not the retired itemsPerPage field', () => {
    expect(blogPageQuery.query).toContain('postList');
    expect(blogPageQuery.query).not.toContain('itemsPerPage');
  });
});
