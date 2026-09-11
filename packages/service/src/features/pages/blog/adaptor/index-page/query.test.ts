import { makeRawBlogPage } from '@blog/service/testing/pages/fixtures';

import { blogPageQuery } from './query';

describe('blogPageQuery', () => {
  it('parses a blog page with no headingBlock', () => {
    const raw = makeRawBlogPage({ headingBlock: null });

    expect(() => blogPageQuery.parse(raw)).not.toThrow();
  });

  it('rejects a blog page with no authored SEO', () => {
    const raw = { ...makeRawBlogPage(), seo: null };

    expect(() => blogPageQuery.parse(raw)).toThrow();
  });

  it('parses a blog page with no modules set', () => {
    const raw = makeRawBlogPage({ modules: null });

    expect(() => blogPageQuery.parse(raw)).not.toThrow();
  });

  it('projects the headingBlock object, not the retired postList reference', () => {
    expect(blogPageQuery.query).toContain(
      '"headingBlock": headingBlock { heading, supportingText }',
    );
    expect(blogPageQuery.query).not.toContain('postList');
  });

  it('parses a blog page with its hero slot set', () => {
    const raw = makeRawBlogPage({
      hero: { _id: 'hero-1', _type: 'module_hero' },
    });

    expect(() => blogPageQuery.parse(raw)).not.toThrow();
  });

  it('parses null as no matching page_blog document, rather than throwing', () => {
    expect(blogPageQuery.parse(null)).toBeNull();
  });
});
