import { makeRawTagIndexPage } from '@blog/service/testing/pages/fixtures';

import { tagIndexPageQuery } from './query';

describe('tagIndexPageQuery', () => {
  it('filters to page_tagIndex documents', () => {
    expect(tagIndexPageQuery.query).toContain('_type == "page_tagIndex"');
  });

  it('parses a tag index page with no supporting text and no SEO', () => {
    const raw = makeRawTagIndexPage({ supportingText: null, seo: null });

    expect(() => tagIndexPageQuery.parse(raw)).not.toThrow();
  });

  it('parses a tag index page with no taxonomyList slot set', () => {
    const raw = makeRawTagIndexPage({ taxonomyList: null });

    expect(() => tagIndexPageQuery.parse(raw)).not.toThrow();
  });

  it('parses null as no matching page_tagIndex document, rather than throwing', () => {
    expect(tagIndexPageQuery.parse(null)).toBeNull();
  });
});
