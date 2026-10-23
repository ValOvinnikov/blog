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

import { featureHighlightsModuleQuery } from './query';

const { EN, NL, FR } = LOCALE_ISO_CODES;

const FEATURE_HIGHLIGHTS_ID = 'feature-highlights-1';
const UNTRANSLATED_ROW = {
  heading: 'Sleep better',
  body: 'Fewer pages.',
  alt: 'A moon',
};

const EN_COPY = {
  heading: 'Why teams switch',
  row: { heading: 'Ship faster', body: 'Less friction.', alt: 'A rocket' },
};

const NL_COPY = {
  heading: 'Waarom teams overstappen',
  row: {
    heading: 'Sneller leveren',
    body: 'Minder frictie.',
    alt: 'Een raket',
  },
};

const featureHighlightsDocument = {
  _id: FEATURE_HIGHLIGHTS_ID,
  _type: 'module_featureHighlights',
  brandVariant: BRAND_VARIANT.PRIMARY,
  mediaOrder: MEDIA_ORDER.FIRST,
  headingBlock: mockLocalizedHeadingBlock({
    [EN]: EN_COPY.heading,
    [NL]: NL_COPY.heading,
  }),
  highlights: [
    {
      _key: 'row-1',
      _type: 'featureHighlight',
      heading: mockLocalizedStrings({
        [EN]: EN_COPY.row.heading,
        [NL]: NL_COPY.row.heading,
      }),
      body: mockLocalizedListedText({
        [EN]: EN_COPY.row.body,
        [NL]: NL_COPY.row.body,
      }),
      image: mockLocalizedImage({
        [EN]: EN_COPY.row.alt,
        [NL]: NL_COPY.row.alt,
      }),
    },
    {
      _key: 'row-2',
      _type: 'featureHighlight',
      heading: mockLocalizedStrings({ [EN]: UNTRANSLATED_ROW.heading }),
      body: mockLocalizedListedText({ [EN]: UNTRANSLATED_ROW.body }),
      image: mockLocalizedImage({ [EN]: UNTRANSLATED_ROW.alt }),
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
    { id: FEATURE_HIGHLIGHTS_ID, locale, defaultLocale: EN },
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

    expect(
      featureHighlightsModuleQuery.parse(raw).highlights?.[0]?.action,
    ).toBeNull();
  });

  it.each([
    ['picks the heading and each row in the visitor language', NL, NL_COPY],
    [
      'falls back to the default language for the heading and each row',
      FR,
      EN_COPY,
    ],
  ])('%s', async (_, locale, copy) => {
    const module = await runFeatureHighlights(
      featureHighlightsDocument,
      locale,
    );

    expect(module.headingBlock.heading).toBe(copy.heading);
    expect(rowText(module)).toEqual([
      { ...copy.row, body: [[copy.row.body]] },
      { ...UNTRANSLATED_ROW, body: [[UNTRANSLATED_ROW.body]] },
    ]);
  });

  it('fails when a row body is missing in both languages', async () => {
    const [first, second] = featureHighlightsDocument.highlights;

    await expect(
      runFeatureHighlights(
        {
          ...featureHighlightsDocument,
          highlights: [
            first,
            { ...second, body: mockLocalizedListedText({ [FR]: 'Moins.' }) },
          ],
        },
        NL,
      ),
    ).rejects.toThrow();
  });
});
