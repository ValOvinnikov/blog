import {
  BRAND_VARIANT,
  LOCALE_ISO_CODES,
  MEDIA_ORDER,
} from '@blog/config/constants';
import {
  mockRawFeatureHighlightItem,
  mockRawFeatureHighlightsModule,
} from '@blog/service/testing/modules/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import {
  MOCK_IMAGE_ASSET_DOCUMENT,
  mockLocalizedHeadingBlock,
  mockLocalizedImage,
  mockLocalizedListedText,
  mockLocalizedStrings,
} from '@blog/service/testing/shared/localized';
import { faker } from '@faker-js/faker';

import { featureHighlightsModuleQuery } from './query';

faker.seed(4);

const { EN, NL, FR } = LOCALE_ISO_CODES;

const MOCK_FEATURE_HIGHLIGHTS_ID = faker.string.uuid();
const MOCK_UNTRANSLATED_ROW = {
  heading: faker.lorem.words(2),
  body: faker.lorem.sentence(),
  alt: faker.lorem.words(3),
};
const MOCK_FRENCH_ONLY_BODY = faker.lorem.sentence();

const MOCK_EN_COPY = {
  heading: faker.lorem.words(3),
  row: {
    heading: faker.lorem.words(2),
    body: faker.lorem.sentence(),
    alt: faker.lorem.words(3),
  },
};

const MOCK_NL_COPY = {
  heading: faker.lorem.words(3),
  row: {
    heading: faker.lorem.words(2),
    body: faker.lorem.sentence(),
    alt: faker.lorem.words(3),
  },
};

const MOCK_FEATURE_HIGHLIGHTS_DOCUMENT = {
  _id: MOCK_FEATURE_HIGHLIGHTS_ID,
  _type: 'module_featureHighlights',
  brandVariant: BRAND_VARIANT.PRIMARY,
  mediaOrder: MEDIA_ORDER.FIRST,
  headingBlock: mockLocalizedHeadingBlock({
    [EN]: MOCK_EN_COPY.heading,
    [NL]: MOCK_NL_COPY.heading,
  }),
  highlights: [
    {
      _key: faker.string.uuid(),
      _type: 'featureHighlight',
      heading: mockLocalizedStrings({
        [EN]: MOCK_EN_COPY.row.heading,
        [NL]: MOCK_NL_COPY.row.heading,
      }),
      body: mockLocalizedListedText({
        [EN]: MOCK_EN_COPY.row.body,
        [NL]: MOCK_NL_COPY.row.body,
      }),
      image: mockLocalizedImage({
        [EN]: MOCK_EN_COPY.row.alt,
        [NL]: MOCK_NL_COPY.row.alt,
      }),
    },
    {
      _key: faker.string.uuid(),
      _type: 'featureHighlight',
      heading: mockLocalizedStrings({ [EN]: MOCK_UNTRANSLATED_ROW.heading }),
      body: mockLocalizedListedText({ [EN]: MOCK_UNTRANSLATED_ROW.body }),
      image: mockLocalizedImage({ [EN]: MOCK_UNTRANSLATED_ROW.alt }),
    },
  ],
};

async function runFeatureHighlights(
  document: Record<string, unknown>,
  locale: string,
) {
  const raw = await evaluateGroqExpression(
    featureHighlightsModuleQuery.query,
    [document, MOCK_IMAGE_ASSET_DOCUMENT],
    undefined,
    { id: MOCK_FEATURE_HIGHLIGHTS_ID, locale, defaultLocale: EN },
  );

  return featureHighlightsModuleQuery.parse(raw);
}

function rowText(module: Awaited<ReturnType<typeof runFeatureHighlights>>) {
  return module.highlights.map(({ heading, body, image }) => ({
    heading,
    body: body.map((block) => block.children?.map(({ text }) => text)),
    alt: image.alt,
  }));
}

describe('featureHighlightsModuleQuery', () => {
  it.each([
    ['a module with no headingBlock', { headingBlock: null }, {}],
    ['a module with no highlights', { highlights: null }, {}],
    ['a module with no mediaOrder', { mediaOrder: null }, {}],
    ['a highlight with no heading', {}, { heading: null }],
    ['a highlight with no body', {}, { body: null }],
    ['a highlight with no image', {}, { image: null }],
  ])('rejects %s', (_, moduleOverrides, highlightOverrides) => {
    const raw = {
      ...mockRawFeatureHighlightsModule(),
      highlights: [{ ...mockRawFeatureHighlightItem(), ...highlightOverrides }],
      ...moduleOverrides,
    };

    expect(() => featureHighlightsModuleQuery.parse(raw)).toThrow();
  });

  it('parses a highlight with no action', () => {
    const raw = {
      ...mockRawFeatureHighlightsModule(),
      highlights: [mockRawFeatureHighlightItem({ action: null })],
    };

    const [highlight] = featureHighlightsModuleQuery.parse(raw).highlights;

    expect(highlight?.action).toBeNull();
  });

  it.each([
    [
      'picks the heading and each row in the visitor language',
      NL,
      MOCK_NL_COPY,
    ],
    [
      'falls back to the default language for the heading and each row',
      FR,
      MOCK_EN_COPY,
    ],
  ])('%s', async (_, locale, copy) => {
    const module = await runFeatureHighlights(
      MOCK_FEATURE_HIGHLIGHTS_DOCUMENT,
      locale,
    );

    expect(module.headingBlock.heading).toBe(copy.heading);
    expect(rowText(module)).toEqual([
      { ...copy.row, body: [[copy.row.body]] },
      { ...MOCK_UNTRANSLATED_ROW, body: [[MOCK_UNTRANSLATED_ROW.body]] },
    ]);
  });

  it('fails when a row body is missing in both languages', async () => {
    const [first, second] = MOCK_FEATURE_HIGHLIGHTS_DOCUMENT.highlights;

    await expect(
      runFeatureHighlights(
        {
          ...MOCK_FEATURE_HIGHLIGHTS_DOCUMENT,
          highlights: [
            first,
            {
              ...second,
              body: mockLocalizedListedText({ [FR]: MOCK_FRENCH_ONLY_BODY }),
            },
          ],
        },
        NL,
      ),
    ).rejects.toThrow();
  });
});
