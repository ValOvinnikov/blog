import { makeRawGenericPage } from '@blog/service/testing/pages/fixtures';

import { genericPageQuery } from './query';

describe('genericPageQuery', () => {
  it('parses a generic page with no modules and no SEO', () => {
    const raw = makeRawGenericPage({ modules: null, seo: null });

    expect(() => genericPageQuery.parse(raw)).not.toThrow();
  });

  it('parses a generic page with its hero slot set', () => {
    const raw = makeRawGenericPage({
      hero: { _id: 'hero-1', _type: 'module_hero' },
    });

    expect(() => genericPageQuery.parse(raw)).not.toThrow();
  });

  it('parses null as no matching page_generic document, rather than throwing', () => {
    expect(genericPageQuery.parse(null)).toBeNull();
  });
});
