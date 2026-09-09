import { makeRawHomePage } from '@blog/service/testing/pages/fixtures';
import { makeRawHeadingBlock } from '@blog/service/testing/shared/fixtures';

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

  it('parses a home page with a hero and no headingBlock', () => {
    const raw = makeRawHomePage({ headingBlock: null });

    expect(() => homePageQuery.parse(raw)).not.toThrow();
  });

  it('parses a home page with a headingBlock heading and no hero', () => {
    const raw = makeRawHomePage({
      hero: null,
      headingBlock: makeRawHeadingBlock({
        heading: 'Welcome',
        supportingText: null,
      }),
    });

    expect(() => homePageQuery.parse(raw)).not.toThrow();
  });

  it('parses a home page with both a hero and a headingBlock heading', () => {
    const raw = makeRawHomePage({
      headingBlock: makeRawHeadingBlock({
        heading: 'Welcome',
        supportingText: 'A subtitle',
      }),
    });

    expect(() => homePageQuery.parse(raw)).not.toThrow();
  });
});
