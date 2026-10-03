import { CTA_VARIANT } from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { makeRawCtaModule } from '@blog/service/testing/modules/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';

import { ctaModuleQuery } from './query';

const { EN, NL } = LOCALE_ISO_CODES;

function localized(type: string, values: Partial<Record<string, unknown>>) {
  return Object.entries(values).map(([language, value]) => ({
    _key: language,
    _type: type,
    language,
    value,
  }));
}

function strings(values: Partial<Record<string, string>>) {
  return localized('internationalizedArrayStringValue', values);
}

function paragraph(text: string) {
  return [
    {
      _type: 'block',
      _key: text,
      style: 'normal',
      children: [{ _type: 'span', _key: 'span', text, marks: [] }],
      markDefs: [],
    },
  ];
}

const ctaDocument = {
  _id: 'cta-1',
  _type: 'module_cta',
  variant: CTA_VARIANT.SPLIT,
  brandVariant: 'PRIMARY',
  headingBlock: {
    _type: 'localizedHeadingBlock',
    heading: strings({ [EN]: 'Subscribe', [NL]: 'Abonneer' }),
    supportingText: localized('internationalizedArrayTextValue', {
      [EN]: 'New posts weekly.',
    }),
  },
  eyebrow: strings({ [EN]: 'Newsletter', [NL]: 'Nieuwsbrief' }),
  content: localized('internationalizedArrayListedTextValue', {
    [EN]: paragraph('Read on.'),
    [NL]: paragraph('Lees verder.'),
  }),
  footnote: strings({ [EN]: 'Unsubscribe any time.' }),
  image: {
    _type: 'localizedImageWithAlt',
    asset: { _type: 'reference', _ref: 'image-1' },
    alt: strings({ [EN]: 'A letter', [NL]: 'Een brief' }),
  },
};

const imageAsset = { _id: 'image-1', _type: 'sanity.imageAsset' };

async function runCta(document: Record<string, unknown>) {
  const raw = await evaluateGroqExpression(
    ctaModuleQuery.query,
    [document, imageAsset],
    undefined,
    { id: 'cta-1' },
  );

  return ctaModuleQuery.parse(raw);
}

describe('ctaModuleQuery', () => {
  it('parses a CTA document without a bandTone', () => {
    const raw = makeRawCtaModule({ bandTone: null });

    expect(() => ctaModuleQuery.parse(raw)).not.toThrow();
  });

  it('returns every language entry of each localized field', async () => {
    const cta = await runCta(ctaDocument);

    expect(cta).toMatchObject({
      eyebrow: [
        { language: EN, value: 'Newsletter' },
        { language: NL, value: 'Nieuwsbrief' },
      ],
      headingBlock: {
        heading: [
          { language: EN, value: 'Subscribe' },
          { language: NL, value: 'Abonneer' },
        ],
        supportingText: [{ language: EN, value: 'New posts weekly.' }],
      },
      footnote: [{ language: EN, value: 'Unsubscribe any time.' }],
      image: {
        alt: [
          { language: EN, value: 'A letter' },
          { language: NL, value: 'Een brief' },
        ],
      },
    });
  });

  it('returns the content blocks of each language', async () => {
    const cta = await runCta(ctaDocument);

    expect(cta.content).toMatchObject([
      { language: EN, value: [{ children: [{ text: 'Read on.' }] }] },
      { language: NL, value: [{ children: [{ text: 'Lees verder.' }] }] },
    ]);
  });

  it('returns nothing for a localized field with no entries', async () => {
    const cta = await runCta({
      ...ctaDocument,
      eyebrow: undefined,
      content: undefined,
      headingBlock: { _type: 'localizedHeadingBlock' },
    });

    expect(cta).toMatchObject({
      eyebrow: null,
      content: null,
      headingBlock: { heading: null, supportingText: null },
    });
  });
});
