import { LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  makeRawFeatureHighlightItem,
  makeRawFeatureHighlightsModule,
} from '@blog/service/testing/modules/fixtures';
import { makeRawParagraphTextBlock } from '@blog/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import {
  localizedStrings,
  localizedValues,
} from '@blog/service/testing/shared/localized';

import { featureHighlightsModuleQuery } from './query';

const { EN, NL, FR } = LOCALE_ISO_CODES;

function localizedBody(values: Partial<Record<string, string>>) {
  return localizedValues(
    'internationalizedArrayListedTextValue',
    Object.fromEntries(
      Object.entries(values).map(([language, text]) => [
        language,
        [makeRawParagraphTextBlock({ _key: `block-${language}`, text })],
      ]),
    ),
  );
}

function localizedImage(alt: Partial<Record<string, string>>) {
  return {
    _type: 'localizedImageWithAlt',
    asset: { _type: 'reference', _ref: 'image-1' },
    alt: localizedStrings(alt),
  };
}

const featureHighlightsDocument = {
  _id: 'feature-highlights-1',
  _type: 'module_featureHighlights',
  brandVariant: 'PRIMARY',
  mediaOrder: 'FIRST',
  headingBlock: {
    _type: 'localizedHeadingBlock',
    heading: localizedStrings({
      [EN]: 'Why teams switch',
      [NL]: 'Waarom teams overstappen',
    }),
  },
  highlights: [
    {
      _key: 'row-1',
      _type: 'featureHighlight',
      heading: localizedStrings({
        [EN]: 'Ship faster',
        [NL]: 'Sneller leveren',
      }),
      body: localizedBody({ [EN]: 'Less friction.', [NL]: 'Minder frictie.' }),
      image: localizedImage({ [EN]: 'A rocket', [NL]: 'Een raket' }),
    },
    {
      _key: 'row-2',
      _type: 'featureHighlight',
      heading: localizedStrings({ [EN]: 'Sleep better' }),
      body: localizedBody({ [EN]: 'Fewer pages.' }),
      image: localizedImage({ [EN]: 'A moon' }),
    },
  ],
};

const imageAsset = { _id: 'image-1', _type: 'sanity.imageAsset' };

async function runFeatureHighlights(
  document: Record<string, unknown>,
  locale: string,
) {
  const raw = await evaluateGroqExpression(
    featureHighlightsModuleQuery.query,
    [document, imageAsset],
    undefined,
    { id: 'feature-highlights-1', locale, defaultLocale: EN },
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
  it('filters to module_featureHighlights documents by id', () => {
    expect(featureHighlightsModuleQuery.query).toContain(
      '_type == "module_featureHighlights"',
    );
    expect(featureHighlightsModuleQuery.query).toContain('_id == $id');
  });

  it('rejects a module with no headingBlock', () => {
    const raw = { ...makeRawFeatureHighlightsModule(), headingBlock: null };

    expect(() => featureHighlightsModuleQuery.parse(raw)).toThrow();
  });

  it('rejects a module with no highlights', () => {
    const raw = { ...makeRawFeatureHighlightsModule(), highlights: null };

    expect(() => featureHighlightsModuleQuery.parse(raw)).toThrow();
  });

  it('rejects a highlight with no heading', () => {
    const raw = {
      ...makeRawFeatureHighlightsModule(),
      highlights: [{ ...makeRawFeatureHighlightItem(), heading: null }],
    };

    expect(() => featureHighlightsModuleQuery.parse(raw)).toThrow();
  });

  it('rejects a highlight with no body', () => {
    const raw = {
      ...makeRawFeatureHighlightsModule(),
      highlights: [{ ...makeRawFeatureHighlightItem(), body: null }],
    };

    expect(() => featureHighlightsModuleQuery.parse(raw)).toThrow();
  });

  it('rejects a highlight with no image', () => {
    const raw = {
      ...makeRawFeatureHighlightsModule(),
      highlights: [{ ...makeRawFeatureHighlightItem(), image: null }],
    };

    expect(() => featureHighlightsModuleQuery.parse(raw)).toThrow();
  });

  it('parses a highlight with no action', () => {
    const raw = {
      ...makeRawFeatureHighlightsModule(),
      highlights: [makeRawFeatureHighlightItem({ action: null })],
    };

    expect(() => featureHighlightsModuleQuery.parse(raw)).not.toThrow();
    expect(
      featureHighlightsModuleQuery.parse(raw).highlights?.[0]?.action,
    ).toBeNull();
  });

  it('rejects a module with no mediaOrder', () => {
    const raw = { ...makeRawFeatureHighlightsModule(), mediaOrder: null };

    expect(() => featureHighlightsModuleQuery.parse(raw)).toThrow();
  });

  it('picks the heading and each row in the visitor language', async () => {
    const module = await runFeatureHighlights(featureHighlightsDocument, NL);

    expect(module.headingBlock.heading).toBe('Waarom teams overstappen');
    expect(rowText(module)).toEqual([
      {
        heading: 'Sneller leveren',
        body: [['Minder frictie.']],
        alt: 'Een raket',
      },
      { heading: 'Sleep better', body: [['Fewer pages.']], alt: 'A moon' },
    ]);
  });

  it('falls back to the default language for the heading and each row', async () => {
    const module = await runFeatureHighlights(featureHighlightsDocument, FR);

    expect(module.headingBlock.heading).toBe('Why teams switch');
    expect(rowText(module)).toEqual([
      { heading: 'Ship faster', body: [['Less friction.']], alt: 'A rocket' },
      { heading: 'Sleep better', body: [['Fewer pages.']], alt: 'A moon' },
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
            { ...second, body: localizedBody({ [FR]: 'Moins.' }) },
          ],
        },
        NL,
      ),
    ).rejects.toThrow();
  });
});
