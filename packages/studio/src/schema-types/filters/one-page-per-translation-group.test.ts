import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { PAGE_LANDING_TYPE } from '@blog/studio/schema-types/documents/pages/landing/landing-type';
import { onePagePerTranslationGroupFilter } from '@blog/studio/schema-types/filters/one-page-per-translation-group';
import { setDefaultLanguage } from '@blog/studio/schema-types/validation/default-language/default-language';
import {
  mockLandingPage,
  mockTranslationMetadata,
} from '@blog/studio/testing/mock-documents';
import { faker } from '@faker-js/faker';
import { evaluate, parse } from 'groq-js';
import { getDraftId } from 'sanity';

faker.seed(4115);

const { EN, NL, FR } = LOCALE_ISO_CODES;

const MOCK_TRANSLATED_EN_ID = faker.string.uuid();
const MOCK_TRANSLATED_NL_ID = faker.string.uuid();
const MOCK_NL_ONLY_ID = faker.string.uuid();
const MOCK_NO_DEFAULT_NL_ID = faker.string.uuid();
const MOCK_NO_DEFAULT_FR_ID = faker.string.uuid();
const MOCK_DELETED_EN_ID = faker.string.uuid();
const MOCK_SURVIVING_NL_ID = faker.string.uuid();
const MOCK_UNLOCALIZED_ID = faker.string.uuid();

const MOCK_TRANSLATED_EN = mockLandingPage({
  _id: MOCK_TRANSLATED_EN_ID,
  language: EN,
});
const MOCK_TRANSLATED_NL = mockLandingPage({
  _id: MOCK_TRANSLATED_NL_ID,
  language: NL,
});
const MOCK_TRANSLATION_GROUP = mockTranslationMetadata([
  [MOCK_TRANSLATED_EN_ID, EN],
  [MOCK_TRANSLATED_NL_ID, NL],
]);

const offeredPages = async (dataset: Record<string, unknown>[]) => {
  const { filter, params } = onePagePerTranslationGroupFilter();
  const query = `*[_type == $type && ${filter}] | order(_id asc)._id`;
  const queryParams = { ...params, type: PAGE_LANDING_TYPE };
  const result = await evaluate(parse(query, { params: queryParams }), {
    dataset,
    params: queryParams,
  });

  return result.get();
};

describe(onePagePerTranslationGroupFilter, () => {
  afterEach(() => {
    setDefaultLanguage(EN);
  });

  it.each([
    {
      behaviour:
        'offers a translated page once, as its default-language document',
      dataset: [MOCK_TRANSLATED_EN, MOCK_TRANSLATED_NL, MOCK_TRANSLATION_GROUP],
      expected: [MOCK_TRANSLATED_EN_ID],
    },
    {
      behaviour: 'offers a page that exists in one non-default language once',
      dataset: [mockLandingPage({ _id: MOCK_NL_ONLY_ID, language: NL })],
      expected: [MOCK_NL_ONLY_ID],
    },
    {
      behaviour:
        'offers a translated page with no default-language document once',
      dataset: [
        mockLandingPage({ _id: MOCK_NO_DEFAULT_NL_ID, language: NL }),
        mockLandingPage({ _id: MOCK_NO_DEFAULT_FR_ID, language: FR }),
        mockTranslationMetadata([
          [MOCK_NO_DEFAULT_NL_ID, NL],
          [MOCK_NO_DEFAULT_FR_ID, FR],
        ]),
      ],
      expected: [MOCK_NO_DEFAULT_NL_ID],
    },
    {
      behaviour:
        'passes over a deleted default-language document still in the group',
      dataset: [
        mockLandingPage({ _id: MOCK_SURVIVING_NL_ID, language: NL }),
        mockTranslationMetadata([
          [MOCK_DELETED_EN_ID, EN],
          [MOCK_SURVIVING_NL_ID, NL],
        ]),
      ],
      expected: [MOCK_SURVIVING_NL_ID],
    },
    {
      behaviour:
        'hides the draft of a non-default translation with its published one',
      dataset: [
        MOCK_TRANSLATED_EN,
        MOCK_TRANSLATED_NL,
        mockLandingPage({
          _id: getDraftId(MOCK_TRANSLATED_NL_ID),
          language: NL,
        }),
        MOCK_TRANSLATION_GROUP,
      ],
      expected: [MOCK_TRANSLATED_EN_ID],
    },
    {
      behaviour: 'treats a page without a language as the default language',
      dataset: [mockLandingPage({ _id: MOCK_UNLOCALIZED_ID })],
      expected: [MOCK_UNLOCALIZED_ID],
    },
  ])('$behaviour', async ({ dataset, expected }) => {
    const offered = await offeredPages(dataset);

    expect(offered).toEqual(expected);
  });

  it('follows the site default language', async () => {
    setDefaultLanguage(NL);

    const offered = await offeredPages([
      MOCK_TRANSLATED_EN,
      MOCK_TRANSLATED_NL,
      MOCK_TRANSLATION_GROUP,
    ]);

    expect(offered).toEqual([MOCK_TRANSLATED_NL_ID]);
  });
});
