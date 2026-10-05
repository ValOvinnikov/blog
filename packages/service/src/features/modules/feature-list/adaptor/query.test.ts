import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { localizedStrings } from '@blog/service/testing/shared/localized';

import { featureListModuleQuery } from './query';

const { EN, NL, FR } = LOCALE_ISO_CODES;

function localizedHeadingBlock(heading: Partial<Record<string, string>>) {
  return { _type: 'localizedHeadingBlock', heading: localizedStrings(heading) };
}

const featureListDocument = {
  _id: 'feature-list-1',
  _type: 'module_featureList',
  brandVariant: 'PRIMARY',
  headingBlock: localizedHeadingBlock({
    [EN]: 'What you get',
    [NL]: 'Wat je krijgt',
  }),
  features: [
    { _key: 'ref-1', _type: 'reference', _ref: 'feature-1' },
    { _key: 'ref-2', _type: 'reference', _ref: 'feature-2' },
  ],
  imageShape: 'WIDE',
  cardAlignment: 'LEFT',
};

const translatedFeature = {
  _id: 'feature-1',
  _type: 'block_feature',
  headingBlock: localizedHeadingBlock({ [EN]: 'Fast', [NL]: 'Snel' }),
  image: {
    _type: 'localizedImageWithAlt',
    asset: { _type: 'reference', _ref: 'image-1' },
    alt: localizedStrings({ [EN]: 'A rocket', [NL]: 'Een raket' }),
  },
};

const englishOnlyFeature = {
  _id: 'feature-2',
  _type: 'block_feature',
  headingBlock: localizedHeadingBlock({ [EN]: 'Calm' }),
  image: {
    _type: 'localizedImageWithAlt',
    asset: { _type: 'reference', _ref: 'image-1' },
    alt: localizedStrings({ [EN]: 'A lake' }),
  },
};

const imageAsset = { _id: 'image-1', _type: 'sanity.imageAsset' };

async function runFeatureList(locale: string) {
  const raw = await evaluateGroqExpression(
    featureListModuleQuery.query,
    [featureListDocument, translatedFeature, englishOnlyFeature, imageAsset],
    undefined,
    { id: 'feature-list-1', locale, defaultLocale: EN },
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
  it('picks the heading and each feature in the visitor language', async () => {
    const module = await runFeatureList(NL);

    expect(module.headingBlock.heading).toBe('Wat je krijgt');
    expect(featureText(module)).toEqual([
      { heading: 'Snel', alt: 'Een raket' },
      { heading: 'Calm', alt: 'A lake' },
    ]);
  });

  it('falls back to the default language for the heading and each feature', async () => {
    const module = await runFeatureList(FR);

    expect(module.headingBlock.heading).toBe('What you get');
    expect(featureText(module)).toEqual([
      { heading: 'Fast', alt: 'A rocket' },
      { heading: 'Calm', alt: 'A lake' },
    ]);
  });
});
