import { BRAND_TAGLINE_SEPARATORS } from '@blog/config/constants';
import { mockEnglishString } from '@blog/studio/testing/migrations/localized';
import { faker } from '@faker-js/faker';
import { at, set } from 'sanity/migrate';

import { copyBrandTaglineIntoNavigation } from './index';

faker.seed(27);

const mockTagline = (text: string) => ({
  _type: 'brandTagline',
  separator: BRAND_TAGLINE_SEPARATORS.DOT,
  items: [
    {
      _key: 'item-1',
      _type: 'brandTaglineItem',
      text: mockEnglishString(text),
    },
  ],
});

const MOCK_SITE_TAGLINE = mockTagline(faker.lorem.word());
const MOCK_NAVIGATION_TAGLINE = mockTagline(faker.lorem.word());

describe(copyBrandTaglineIntoNavigation, () => {
  it('copies the site tagline into navigation settings that have none', () => {
    expect(copyBrandTaglineIntoNavigation({}, MOCK_SITE_TAGLINE)).toEqual([
      at('tagline', set(MOCK_SITE_TAGLINE)),
    ]);
  });

  it('fills a navigation tagline that has no items', () => {
    expect(
      copyBrandTaglineIntoNavigation(
        { tagline: { items: [] } },
        MOCK_SITE_TAGLINE,
      ),
    ).toEqual([at('tagline', set(MOCK_SITE_TAGLINE))]);
  });

  it.each([
    {
      name: 'a navigation tagline already filled in',
      doc: { tagline: MOCK_NAVIGATION_TAGLINE },
      siteTagline: MOCK_SITE_TAGLINE,
    },
    { name: 'a site without a tagline', doc: {}, siteTagline: null },
    {
      name: 'a site tagline with no items',
      doc: {},
      siteTagline: { items: [] },
    },
  ])('leaves $name alone', ({ doc, siteTagline }) => {
    expect(copyBrandTaglineIntoNavigation(doc, siteTagline)).toBeUndefined();
  });
});
