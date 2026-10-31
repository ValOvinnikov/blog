import {
  LOCALE_ISO_CODES,
  PORTABLE_TEXT_BLOCK_TYPE,
} from '@blog/config/constants';
import {
  MOCK_MISSING_ID,
  mockReference,
} from '@blog/service/testing/shared/fixtures';
import { evaluateGroqInLocale } from '@blog/service/testing/shared/groq';
import {
  mockLocalizedEntry,
  mockLocalizedLinkDocument,
  mockLocalizedStrings,
} from '@blog/service/testing/shared/localized';
import { faker } from '@faker-js/faker';

import { footerQuery } from './query';

faker.seed(5087);

const { EN, NL, FR } = LOCALE_ISO_CODES;

const MOCK_LINK_ID = faker.string.uuid();
const MOCK_LINK_LABEL = faker.lorem.word();
const MOCK_ENGLISH_HEADING = faker.lorem.word();
const MOCK_DUTCH_HEADING = faker.lorem.word();
const MOCK_ENGLISH_ABOUT = faker.lorem.sentence();
const MOCK_DUTCH_ABOUT = faker.lorem.sentence();
const MOCK_ADDRESS = faker.location.streetAddress({ useFullAddress: true });
const MOCK_COOKIE_SETTINGS_TYPE = 'cookieSettingsItem';

function mockLinkRef(id: string) {
  return {
    _key: faker.string.uuid(),
    _type: PORTABLE_TEXT_BLOCK_TYPE.LINK_REF,
    link: mockReference(id),
  };
}

const MOCK_FOOTER_DOCUMENT = {
  _id: faker.string.uuid(),
  _type: 'settings_footer',
  groups: [
    {
      _key: faker.string.uuid(),
      _type: 'footerLinkGroup',
      heading: mockLocalizedStrings({
        [EN]: MOCK_ENGLISH_HEADING,
        [NL]: MOCK_DUTCH_HEADING,
      }),
      links: [mockLinkRef(MOCK_MISSING_ID), mockLinkRef(MOCK_LINK_ID)],
    },
  ],
  about: mockLocalizedStrings({
    [EN]: MOCK_ENGLISH_ABOUT,
    [NL]: MOCK_DUTCH_ABOUT,
  }),
  address: [mockLocalizedEntry(EN, MOCK_ADDRESS)],
  finePrint: [
    mockLinkRef(MOCK_LINK_ID),
    { _key: faker.string.uuid(), _type: MOCK_COOKIE_SETTINGS_TYPE },
    mockLinkRef(MOCK_MISSING_ID),
  ],
};

async function runFooterQuery(locale: string) {
  const raw = await evaluateGroqInLocale(
    footerQuery.query,
    [
      MOCK_FOOTER_DOCUMENT,
      mockLocalizedLinkDocument(MOCK_LINK_ID, MOCK_LINK_LABEL),
    ],
    locale,
  );

  return footerQuery.parse(raw);
}

describe('footerQuery', () => {
  it('resolves group links in order, a missing link resolving to none', async () => {
    const { groups } = await runFooterQuery(EN);

    expect(groups).toEqual([
      {
        heading: MOCK_ENGLISH_HEADING,
        links: [
          { link: null },
          { link: expect.objectContaining({ label: MOCK_LINK_LABEL }) },
        ],
      },
    ]);
  });

  it('keeps fine-print items in order, telling links from cookie settings', async () => {
    const { finePrint } = await runFooterQuery(EN);

    expect(finePrint).toEqual([
      {
        _type: PORTABLE_TEXT_BLOCK_TYPE.LINK_REF,
        link: expect.objectContaining({ label: MOCK_LINK_LABEL }),
      },
      { _type: MOCK_COOKIE_SETTINGS_TYPE },
      { _type: PORTABLE_TEXT_BLOCK_TYPE.LINK_REF, link: null },
    ]);
  });

  it('picks the heading and about text in the visitor language', async () => {
    const { groups, about } = await runFooterQuery(NL);

    expect({ heading: groups?.[0]?.heading, about }).toEqual({
      heading: MOCK_DUTCH_HEADING,
      about: MOCK_DUTCH_ABOUT,
    });
  });

  it('falls back to the default language for the about text and address', async () => {
    const { about, address } = await runFooterQuery(FR);

    expect({ about, address }).toEqual({
      about: MOCK_ENGLISH_ABOUT,
      address: MOCK_ADDRESS,
    });
  });
});
