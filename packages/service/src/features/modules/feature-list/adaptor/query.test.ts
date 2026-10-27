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
import { faker } from '@faker-js/faker';

import { featureListModuleQuery } from './query';

faker.seed(2);

const { EN, NL, FR } = LOCALE_ISO_CODES;

const MOCK_TRANSLATED_FEATURE_ID = faker.string.uuid();
const MOCK_ENGLISH_ONLY_FEATURE_ID = faker.string.uuid();
const MOCK_ENGLISH_ONLY_FEATURE = {
  heading: faker.lorem.words(2),
  alt: faker.lorem.words(3),
};

const MOCK_EN_COPY = {
  heading: faker.lorem.words(3),
  feature: { heading: faker.lorem.words(2), alt: faker.lorem.words(3) },
};

const MOCK_NL_COPY = {
  heading: faker.lorem.words(3),
  feature: { heading: faker.lorem.words(2), alt: faker.lorem.words(3) },
};

const MOCK_FEATURE_LIST_DOCUMENT = {
  _id: MOCK_FEATURE_LIST_MODULE_ID,
  _type: 'module_featureList',
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: mockLocalizedHeadingBlock({
    [EN]: MOCK_EN_COPY.heading,
    [NL]: MOCK_NL_COPY.heading,
  }),
  features: [
    mockReference(MOCK_TRANSLATED_FEATURE_ID, { _key: faker.string.uuid() }),
    mockReference(MOCK_ENGLISH_ONLY_FEATURE_ID, { _key: faker.string.uuid() }),
  ],
  imageShape: CARD_IMAGE_SHAPE.WIDE,
  cardAlignment: CONTENT_ALIGNMENT.LEFT,
};

const MOCK_TRANSLATED_FEATURE = {
  _id: MOCK_TRANSLATED_FEATURE_ID,
  _type: 'block_feature',
  headingBlock: mockLocalizedHeadingBlock({
    [EN]: MOCK_EN_COPY.feature.heading,
    [NL]: MOCK_NL_COPY.feature.heading,
  }),
  image: mockLocalizedImage({
    [EN]: MOCK_EN_COPY.feature.alt,
    [NL]: MOCK_NL_COPY.feature.alt,
  }),
};

const MOCK_ENGLISH_ONLY_FEATURE_DOCUMENT = {
  _id: MOCK_ENGLISH_ONLY_FEATURE_ID,
  _type: 'block_feature',
  headingBlock: mockLocalizedHeadingBlock({
    [EN]: MOCK_ENGLISH_ONLY_FEATURE.heading,
  }),
  image: mockLocalizedImage({ [EN]: MOCK_ENGLISH_ONLY_FEATURE.alt }),
};

async function runFeatureList(locale: string) {
  const raw = await evaluateGroqExpression(
    featureListModuleQuery.query,
    [
      MOCK_FEATURE_LIST_DOCUMENT,
      MOCK_TRANSLATED_FEATURE,
      MOCK_ENGLISH_ONLY_FEATURE_DOCUMENT,
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
    [
      'picks the heading and each feature in the visitor language',
      NL,
      MOCK_NL_COPY,
    ],
    [
      'falls back to the default language for the heading and each feature',
      FR,
      MOCK_EN_COPY,
    ],
  ])('%s', async (_, locale, copy) => {
    const module = await runFeatureList(locale);

    expect(module.headingBlock.heading).toBe(copy.heading);
    expect(featureText(module)).toEqual([
      copy.feature,
      MOCK_ENGLISH_ONLY_FEATURE,
    ]);
  });
});
