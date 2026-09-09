import { makeRawHomePage } from '@blog/service/testing/pages/fixtures';

import { homePageQuery } from './query';

describe('homePageQuery', () => {
  it('parses a home page whose SEO openGraph has no image (null ogImage)', () => {
    const raw = makeRawHomePage({
      seo: {
        metaTitle: 'Home',
        metaDescription: null,
        openGraph: { ogTitle: null, ogDescription: null, ogImage: null },
      },
    });

    expect(() => homePageQuery.parse(raw)).not.toThrow();
  });

  it('parses null as no matching page_home document, rather than throwing', () => {
    expect(homePageQuery.parse(null)).toBeNull();
  });

  it('parses a home page with a hero and no sectionHeader', () => {
    const raw = makeRawHomePage({ sectionHeader: null });

    expect(() => homePageQuery.parse(raw)).not.toThrow();
  });

  it('parses a home page with a sectionHeader heading and no hero', () => {
    const raw = makeRawHomePage({
      hero: null,
      sectionHeader: { heading: 'Welcome', supportingText: null },
    });

    expect(() => homePageQuery.parse(raw)).not.toThrow();
  });

  it('parses a home page with both a hero and a sectionHeader heading', () => {
    const raw = makeRawHomePage({
      sectionHeader: { heading: 'Welcome', supportingText: 'A subtitle' },
    });

    expect(() => homePageQuery.parse(raw)).not.toThrow();
  });
});
