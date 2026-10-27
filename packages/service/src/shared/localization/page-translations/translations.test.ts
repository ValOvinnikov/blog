import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { mockReference } from '@blog/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import {
  MOCK_ABOUT_EN_PAGE_ID,
  MOCK_ABOUT_NL_PAGE_ID,
  MOCK_ABOUT_NL_SLUG,
  MOCK_ABOUT_SLUG,
  MOCK_ABOUT_TRANSLATION_METADATA,
  MOCK_PRICING_EN_PAGE_ID,
  MOCK_PRICING_NL_PAGE_ID,
  MOCK_PRICING_NL_SLUG,
  MOCK_PRICING_SLUG,
  MOCK_TEAM_EN_PAGE_ID,
  MOCK_TEAM_NL_PAGE_ID,
  MOCK_TEAM_SLUG,
  mockLandingPageDocument,
  mockTranslationMetadata,
} from '@blog/service/testing/shared/translated-pages-dataset';
import { faker } from '@faker-js/faker';

import { translationsQuery } from './translations';

faker.seed(6016);

const { EN, NL } = LOCALE_ISO_CODES;
const MOCK_CONTACT_PAGE_ID = faker.string.uuid();
const MOCK_CONTACT_SLUG = faker.lorem.slug();
const MOCK_MODULES_EN_PAGE_ID = faker.string.uuid();
const MOCK_MODULES_NL_PAGE_ID = faker.string.uuid();
const MOCK_MODULES_SLUG = faker.lorem.slug();
const MOCK_FAQ_EN_PAGE_ID = faker.string.uuid();
const MOCK_FAQ_NL_PAGE_ID = faker.string.uuid();
const MOCK_FAQ_EN_SLUG = faker.lorem.slug();
const MOCK_FAQ_NL_SLUG = faker.lorem.slug();

const MOCK_ABOUT_EN_PAGE = mockLandingPageDocument(
  MOCK_ABOUT_EN_PAGE_ID,
  EN,
  MOCK_ABOUT_SLUG,
);
const MOCK_ABOUT_NL_PAGE = mockLandingPageDocument(
  MOCK_ABOUT_NL_PAGE_ID,
  NL,
  MOCK_ABOUT_NL_SLUG,
);
const MOCK_CONTACT_PAGE = mockLandingPageDocument(
  MOCK_CONTACT_PAGE_ID,
  EN,
  MOCK_CONTACT_SLUG,
);
const MOCK_PRICING_EN_PAGE = mockLandingPageDocument(
  MOCK_PRICING_EN_PAGE_ID,
  EN,
  MOCK_PRICING_SLUG,
);
const MOCK_TEAM_EN_PAGE = mockLandingPageDocument(
  MOCK_TEAM_EN_PAGE_ID,
  EN,
  MOCK_TEAM_SLUG,
);
const MOCK_FAQ_EN_PAGE = {
  ...mockLandingPageDocument(MOCK_FAQ_EN_PAGE_ID, EN, MOCK_FAQ_EN_SLUG),
  parent: mockReference(MOCK_MODULES_EN_PAGE_ID),
};

const MOCK_DATASET = [
  MOCK_ABOUT_EN_PAGE,
  MOCK_ABOUT_NL_PAGE,
  MOCK_CONTACT_PAGE,
  MOCK_PRICING_EN_PAGE,
  mockLandingPageDocument(
    `drafts.${MOCK_PRICING_NL_PAGE_ID}`,
    NL,
    MOCK_PRICING_NL_SLUG,
  ),
  MOCK_TEAM_EN_PAGE,
  mockLandingPageDocument(MOCK_TEAM_NL_PAGE_ID, NL),
  mockLandingPageDocument(MOCK_MODULES_EN_PAGE_ID, EN, MOCK_MODULES_SLUG),
  mockLandingPageDocument(MOCK_MODULES_NL_PAGE_ID, NL, MOCK_MODULES_SLUG),
  MOCK_FAQ_EN_PAGE,
  {
    ...mockLandingPageDocument(MOCK_FAQ_NL_PAGE_ID, NL, MOCK_FAQ_NL_SLUG),
    parent: mockReference(MOCK_MODULES_NL_PAGE_ID),
  },
  mockTranslationMetadata(faker.string.uuid(), [
    [EN, MOCK_FAQ_EN_PAGE_ID],
    [NL, MOCK_FAQ_NL_PAGE_ID],
  ]),
  MOCK_ABOUT_TRANSLATION_METADATA,
  mockTranslationMetadata(faker.string.uuid(), [
    [EN, MOCK_PRICING_EN_PAGE_ID],
    [NL, MOCK_PRICING_NL_PAGE_ID],
  ]),
  mockTranslationMetadata(faker.string.uuid(), [
    [EN, MOCK_TEAM_EN_PAGE_ID],
    [NL, MOCK_TEAM_NL_PAGE_ID],
  ]),
];

const MOCK_ABOUT_TRANSLATIONS = [
  { language: EN, slug: MOCK_ABOUT_SLUG },
  { language: NL, slug: MOCK_ABOUT_NL_SLUG },
];

function resolve(root: { _id: string }): Promise<unknown> {
  return evaluateGroqExpression(
    `*[_id == $id][0]{ "translations": ${translationsQuery.query} }.translations`,
    MOCK_DATASET,
    undefined,
    { id: root._id },
  );
}

describe('translationsQuery', () => {
  it.each([
    {
      behaviour: 'lists every translation, the page itself included',
      page: MOCK_ABOUT_EN_PAGE,
      expected: MOCK_ABOUT_TRANSLATIONS,
    },
    {
      behaviour: 'lists the same set from a translation',
      page: MOCK_ABOUT_NL_PAGE,
      expected: MOCK_ABOUT_TRANSLATIONS,
    },
    {
      behaviour: 'is null when the page has no translation metadata',
      page: MOCK_CONTACT_PAGE,
      expected: null,
    },
    {
      behaviour: 'skips a translation that is not published',
      page: MOCK_PRICING_EN_PAGE,
      expected: [{ language: EN, slug: MOCK_PRICING_SLUG }],
    },
    {
      behaviour: 'skips a published translation that has no slug',
      page: MOCK_TEAM_EN_PAGE,
      expected: [{ language: EN, slug: MOCK_TEAM_SLUG }],
    },
    {
      behaviour: 'lists a nested page by its full path in each language',
      page: MOCK_FAQ_EN_PAGE,
      expected: [
        { language: EN, slug: `${MOCK_MODULES_SLUG}/${MOCK_FAQ_EN_SLUG}` },
        { language: NL, slug: `${MOCK_MODULES_SLUG}/${MOCK_FAQ_NL_SLUG}` },
      ],
    },
  ])('$behaviour', async ({ page, expected }) => {
    const translations = await resolve(page);

    expect(translations).toEqual(expected);
  });
});
