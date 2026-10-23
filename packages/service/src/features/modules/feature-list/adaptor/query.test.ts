import {
  BRAND_VARIANT,
  CARD_IMAGE_SHAPE,
  CONTENT_ALIGNMENT,
  LOCALE_ISO_CODES,
} from '@blog/config/constants';
import { MOCK_FEATURE_LIST_MODULE_ID } from '@blog/service/testing/modules/fixtures';
import { mockReference } from '@blog/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import {
  MOCK_IMAGE_ASSET_DOCUMENT,
  mockLocalizedHeadingBlock,
  mockLocalizedImage,
} from '@blog/service/testing/shared/localized';

import { featureListModuleQuery } from './query';

const { EN, NL, FR } = LOCALE_ISO_CODES;

const TRANSLATED_FEATURE_ID = 'feature-1';
const ENGLISH_ONLY_FEATURE_ID = 'feature-2';
const ENGLISH_ONLY_FEATURE = { heading: 'Calm', alt: 'A lake' };

const EN_COPY = {
  heading: 'What you get',
  feature: { heading: 'Fast', alt: 'A rocket' },
};

const NL_COPY = {
  heading: 'Wat je krijgt',
  feature: { heading: 'Snel', alt: 'Een raket' },
};

const featureListDocument = {
  _id: MOCK_FEATURE_LIST_MODULE_ID,
  _type: 'module_featureList',
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: mockLocalizedHeadingBlock({
    [EN]: EN_COPY.heading,
    [NL]: NL_COPY.heading,
  }),
  features: [
    mockReference(TRANSLATED_FEATURE_ID, { _key: 'ref-1' }),
    mockReference(ENGLISH_ONLY_FEATURE_ID, { _key: 'ref-2' }),
  ],
  imageShape: CARD_IMAGE_SHAPE.WIDE,
  cardAlignment: CONTENT_ALIGNMENT.LEFT,
};

const translatedFeature = {
  _id: TRANSLATED_FEATURE_ID,
  _type: 'block_feature',
  headingBlock: mockLocalizedHeadingBlock({
    [EN]: EN_COPY.feature.heading,
    [NL]: NL_COPY.feature.heading,
  }),
  image: mockLocalizedImage({
    [EN]: EN_COPY.feature.alt,
    [NL]: NL_COPY.feature.alt,
  }),
};

const englishOnlyFeature = {
  _id: ENGLISH_ONLY_FEATURE_ID,
  _type: 'block_feature',
  headingBlock: mockLocalizedHeadingBlock({
    [EN]: ENGLISH_ONLY_FEATURE.heading,
  }),
  image: mockLocalizedImage({ [EN]: ENGLISH_ONLY_FEATURE.alt }),
};

async function runFeatureList(locale: string) {
  const raw = await evaluateGroqExpression(
    featureListModuleQuery.query,
    [
      featureListDocument,
      translatedFeature,
      englishOnlyFeature,
      MOCK_IMAGE_ASSET_DOCUMENT,
    ],
    undefined,
    { id: MOCK_FEATURE_LIST_MODULE_ID, locale, defaultLocale: EN },
  );

  return featureListModuleQuery.parse(raw);
}

function featureText(module: Awaited<ReturnType<typeof runFeatureList>>) {
  return module.features?.map(({ headingBlock, image }) => ({
    heading: headingBlock.heading,
    alt: image?.alt,
  }));
}

describe('featureListModuleQuery', () => {
  it.each([
    ['picks the heading and each feature in the visitor language', NL, NL_COPY],
    [
      'falls back to the default language for the heading and each feature',
      FR,
      EN_COPY,
    ],
  ])('%s', async (_, locale, copy) => {
    const module = await runFeatureList(locale);

    expect(module.headingBlock.heading).toBe(copy.heading);
    expect(featureText(module)).toEqual([copy.feature, ENGLISH_ONLY_FEATURE]);
  });
});
