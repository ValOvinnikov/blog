import { LOCALE_ISO_CODES } from '@blog/config';
import { faker } from '@faker-js/faker';

import { toLiveLanguagePages } from './to-live-language-pages';

faker.seed(6012);

const { EN, NL } = LOCALE_ISO_CODES;

const MOCK_PAGES = [
  { language: EN, slug: faker.lorem.slug(2) },
  { language: NL, slug: faker.lorem.slug(2) },
];

describe(toLiveLanguagePages, () => {
  it('keeps pages whose language is live', () => {
    expect(
      toLiveLanguagePages({ pages: MOCK_PAGES, liveLocales: [EN, NL] }),
    ).toEqual(MOCK_PAGES);
  });

  it('excludes a page whose language is not live', () => {
    expect(
      toLiveLanguagePages({ pages: MOCK_PAGES, liveLocales: [EN] }),
    ).toEqual([MOCK_PAGES[0]]);
  });
});
