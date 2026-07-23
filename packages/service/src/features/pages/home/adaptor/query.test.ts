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
});
