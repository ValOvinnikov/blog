import { faker } from '@faker-js/faker';
import { LINK_TYPE } from '@shinefold/config';
import {
  BRAND_TAGLINE_SEPARATORS,
  LOCALE_ISO_CODES,
  PORTABLE_TEXT_BLOCK_TYPE,
} from '@shinefold/config/constants';
import {
  MOCK_MISSING_ID,
  mockReference,
} from '@shinefold/service/testing/shared/fixtures';
import { evaluateGroqInLocale } from '@shinefold/service/testing/shared/groq';
import {
  mockLocalizedLinkDocument,
  mockLocalizedStrings,
} from '@shinefold/service/testing/shared/localized';

import { navigationQuery } from './query';

faker.seed(6075);

const { EN, NL, FR } = LOCALE_ISO_CODES;

const MOCK_PARENT_LINK_ID = faker.string.uuid();
const MOCK_SUB_LINK_ID = faker.string.uuid();
const MOCK_SUB_LABEL = faker.lorem.word();
const MOCK_FIRST_TAGLINE_KEY = faker.string.uuid();
const MOCK_SECOND_TAGLINE_KEY = faker.string.uuid();
const MOCK_ENGLISH_TAGLINE_ITEM = faker.lorem.word();
const MOCK_DUTCH_TAGLINE_ITEM = faker.lorem.word();
const MOCK_UNTRANSLATED_TAGLINE_ITEM = faker.lorem.word();
const MOCK_HEADER_ACTION_LINK_ID = faker.string.uuid();
const MOCK_ENGLISH_ACTION_LABEL = faker.lorem.words(2);
const MOCK_DUTCH_ACTION_LABEL = faker.lorem.words(2);
const MOCK_ENGLISH_ACTION_URL = faker.internet.url();
const MOCK_DUTCH_ACTION_URL = faker.internet.url();

const MOCK_NAVIGATION_DOCUMENT = {
  _id: faker.string.uuid(),
  _type: 'settings_navigation',
  items: [
    {
      _key: faker.string.uuid(),
      _type: 'linkRefWithSubItems',
      link: mockReference(MOCK_PARENT_LINK_ID),
      subItems: [
        {
          _key: faker.string.uuid(),
          _type: PORTABLE_TEXT_BLOCK_TYPE.LINK_REF,
          link: mockReference(MOCK_MISSING_ID),
        },
        {
          _key: faker.string.uuid(),
          _type: PORTABLE_TEXT_BLOCK_TYPE.LINK_REF,
          link: mockReference(MOCK_SUB_LINK_ID),
        },
      ],
    },
  ],
};

const MOCK_TAGLINE_NAVIGATION_DOCUMENT = {
  _id: faker.string.uuid(),
  _type: 'settings_navigation',
  tagline: {
    _type: 'brandTagline',
    items: [
      {
        _key: MOCK_FIRST_TAGLINE_KEY,
        _type: 'brandTaglineItem',
        text: mockLocalizedStrings({
          [EN]: MOCK_ENGLISH_TAGLINE_ITEM,
          [NL]: MOCK_DUTCH_TAGLINE_ITEM,
        }),
      },
      {
        _key: MOCK_SECOND_TAGLINE_KEY,
        _type: 'brandTaglineItem',
        text: mockLocalizedStrings({ [EN]: MOCK_UNTRANSLATED_TAGLINE_ITEM }),
      },
    ],
    separator: BRAND_TAGLINE_SEPARATORS.DOT,
  },
};

const MOCK_HEADER_ACTION_NAVIGATION_DOCUMENT = {
  _id: faker.string.uuid(),
  _type: 'settings_navigation',
  headerAction: mockReference(MOCK_HEADER_ACTION_LINK_ID),
};

const MOCK_HEADER_ACTION_LINK_DOCUMENT = {
  _id: MOCK_HEADER_ACTION_LINK_ID,
  _type: 'link',
  linkType: LINK_TYPE.EXTERNAL,
  label: mockLocalizedStrings({
    [EN]: MOCK_ENGLISH_ACTION_LABEL,
    [NL]: MOCK_DUTCH_ACTION_LABEL,
  }),
  url: mockLocalizedStrings({
    [EN]: MOCK_ENGLISH_ACTION_URL,
    [NL]: MOCK_DUTCH_ACTION_URL,
  }),
};

async function runNavigationTagline(locale: string) {
  const raw = await evaluateGroqInLocale(
    navigationQuery.query,
    [MOCK_TAGLINE_NAVIGATION_DOCUMENT],
    locale,
  );

  return navigationQuery.parse(raw).tagline?.items;
}

describe('navigationQuery', () => {
  it('resolves a sub-item whose link is missing to no link, keeping the rest', async () => {
    const raw = await evaluateGroqInLocale(
      navigationQuery.query,
      [
        MOCK_NAVIGATION_DOCUMENT,
        mockLocalizedLinkDocument(MOCK_PARENT_LINK_ID, faker.lorem.word()),
        mockLocalizedLinkDocument(MOCK_SUB_LINK_ID, MOCK_SUB_LABEL),
      ],
      EN,
    );

    const [item] = navigationQuery.parse(raw).items ?? [];

    expect(item && 'subItems' in item && item.subItems).toEqual([
      { link: null },
      { link: expect.objectContaining({ label: MOCK_SUB_LABEL }) },
    ]);
  });

  it.each([
    {
      outcome: 'in the visitor language',
      locale: NL,
      label: MOCK_DUTCH_ACTION_LABEL,
      url: MOCK_DUTCH_ACTION_URL,
    },
    {
      outcome: 'in the default language when the visitor one is missing',
      locale: FR,
      label: MOCK_ENGLISH_ACTION_LABEL,
      url: MOCK_ENGLISH_ACTION_URL,
    },
  ])('resolves the header action $outcome', async ({ locale, label, url }) => {
    const raw = await evaluateGroqInLocale(
      navigationQuery.query,
      [
        MOCK_HEADER_ACTION_NAVIGATION_DOCUMENT,
        MOCK_HEADER_ACTION_LINK_DOCUMENT,
      ],
      locale,
    );

    expect(navigationQuery.parse(raw).headerAction).toEqual(
      expect.objectContaining({ label, url }),
    );
  });

  it('picks each tagline item in the visitor language', async () => {
    expect(await runNavigationTagline(NL)).toEqual([
      { _key: MOCK_FIRST_TAGLINE_KEY, text: MOCK_DUTCH_TAGLINE_ITEM },
      { _key: MOCK_SECOND_TAGLINE_KEY, text: MOCK_UNTRANSLATED_TAGLINE_ITEM },
    ]);
  });

  it('falls back to the default language for tagline items', async () => {
    expect(await runNavigationTagline(FR)).toEqual([
      { _key: MOCK_FIRST_TAGLINE_KEY, text: MOCK_ENGLISH_TAGLINE_ITEM },
      { _key: MOCK_SECOND_TAGLINE_KEY, text: MOCK_UNTRANSLATED_TAGLINE_ITEM },
    ]);
  });
});
