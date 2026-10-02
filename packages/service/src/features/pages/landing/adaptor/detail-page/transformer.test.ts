import { makeRawLandingPage } from '@blog/service/testing/pages/fixtures';

import { toLandingPage } from './transformer';

describe('toLandingPage translations', () => {
  it('is empty when the page has no translation metadata', () => {
    const raw = makeRawLandingPage({ translations: null });

    expect(toLandingPage(raw).translations).toEqual([]);
  });

  it('drops entries without a language or slug', () => {
    const raw = makeRawLandingPage({
      translations: [
        { language: 'EN', slug: 'about' },
        { language: null, slug: 'x' },
        { language: 'NL', slug: null },
      ],
    });

    expect(toLandingPage(raw).translations).toEqual([
      { language: 'EN', slug: 'about' },
    ]);
  });
});
