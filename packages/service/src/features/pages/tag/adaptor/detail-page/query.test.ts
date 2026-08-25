import { makeRawTagPage } from '@blog/service/testing/pages/fixtures';

import { tagPageQuery } from './query';

describe('tagPageQuery', () => {
  it('filters to page_tag documents by their own slug', () => {
    expect(tagPageQuery.query).toContain('_type == "page_tag"');
    expect(tagPageQuery.query).toContain('slug.current == $slug');
  });

  it('parses a tag page with no postList slot set and no modules/SEO', () => {
    const raw = makeRawTagPage({ postList: null, modules: null, seo: null });

    expect(() => tagPageQuery.parse(raw)).not.toThrow();
  });

  it('parses a tag page with a postList slot, modules, and SEO', () => {
    const raw = makeRawTagPage({
      modules: [{ _id: 'cta-1', _type: 'module_cta' }],
      seo: { metaTitle: 'TypeScript', metaDescription: null, openGraph: null },
    });

    expect(() => tagPageQuery.parse(raw)).not.toThrow();
  });

  it('parses null as no matching page_tag document, rather than throwing', () => {
    expect(tagPageQuery.parse(null)).toBeNull();
  });
});
