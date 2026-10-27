import {
  BRAND_TAGLINE_SEPARATORS,
  LOCALE_ISO_CODES,
} from '@blog/config/constants';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { mockLocalizedStrings } from '@blog/service/testing/shared/localized';
import { faker } from '@faker-js/faker';

import { siteSettingsQuery } from './query';

faker.seed(6015105);

const { EN, NL, FR } = LOCALE_ISO_CODES;

const MOCK_FIRST_ITEM_KEY = faker.string.uuid();
const MOCK_SECOND_ITEM_KEY = faker.string.uuid();
const MOCK_ENGLISH_ITEM = faker.lorem.word();
const MOCK_DUTCH_ITEM = faker.lorem.word();
const MOCK_UNTRANSLATED_ITEM = faker.lorem.word();

const MOCK_SITE_SETTINGS_DOCUMENT = {
  _id: faker.string.uuid(),
  _type: 'settings_site',
  brand: {
    _type: 'brand',
    name: faker.company.name(),
    tagline: {
      _type: 'brandTagline',
      items: [
        {
          _key: MOCK_FIRST_ITEM_KEY,
          _type: 'brandTaglineItem',
          text: mockLocalizedStrings({
            [EN]: MOCK_ENGLISH_ITEM,
            [NL]: MOCK_DUTCH_ITEM,
          }),
        },
        {
          _key: MOCK_SECOND_ITEM_KEY,
          _type: 'brandTaglineItem',
          text: mockLocalizedStrings({ [EN]: MOCK_UNTRANSLATED_ITEM }),
        },
      ],
      separator: BRAND_TAGLINE_SEPARATORS.DOT,
    },
  },
  currency: 'EUR',
};

async function runSiteSettings(locale: string) {
  const raw = await evaluateGroqExpression(
    siteSettingsQuery.query,
    [MOCK_SITE_SETTINGS_DOCUMENT],
    undefined,
    { locale, defaultLocale: EN },
  );

  return siteSettingsQuery.parse(raw);
}

describe('siteSettingsQuery', () => {
  it('picks each tagline item in the visitor language', async () => {
    const settings = await runSiteSettings(NL);

    expect(settings.brand.tagline?.items).toEqual([
      { _key: MOCK_FIRST_ITEM_KEY, text: MOCK_DUTCH_ITEM },
      { _key: MOCK_SECOND_ITEM_KEY, text: MOCK_UNTRANSLATED_ITEM },
    ]);
  });

  it('falls back to the default language for tagline items', async () => {
    const settings = await runSiteSettings(FR);

    expect(settings.brand.tagline?.items).toEqual([
      { _key: MOCK_FIRST_ITEM_KEY, text: MOCK_ENGLISH_ITEM },
      { _key: MOCK_SECOND_ITEM_KEY, text: MOCK_UNTRANSLATED_ITEM },
    ]);
  });
});
