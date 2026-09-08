import { makeRawLandingPage } from '@blog/service/testing/pages/fixtures';

import { landingPageQuery } from './query';

describe('landingPageQuery', () => {
  it('parses a landing page with no modules and no SEO', () => {
    const raw = makeRawLandingPage({ modules: null, seo: null });

    expect(() => landingPageQuery.parse(raw)).not.toThrow();
  });

  it('parses a landing page with its hero slot set', () => {
    const raw = makeRawLandingPage({
      hero: { _id: 'hero-1', _type: 'module_hero' },
    });

    expect(() => landingPageQuery.parse(raw)).not.toThrow();
  });

  it('parses null as no matching page_landing document, rather than throwing', () => {
    expect(landingPageQuery.parse(null)).toBeNull();
  });
});
