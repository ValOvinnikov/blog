import { CTA_VARIANT } from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { makeRawCtaModule } from '@blog/service/testing/modules/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';

import { ctaModuleQuery } from './query';

const { EN, NL, FR } = LOCALE_ISO_CODES;

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

async function resolveCta(document: Record<string, unknown>, locale: string) {
  const raw = await evaluateGroqExpression(
    ctaModuleQuery.query,
    [document, imageAsset],
    undefined,
    { id: 'cta-1', locale, defaultLocale: EN },
  );

  return ctaModuleQuery.parse(raw);
}

describe('ctaModuleQuery', () => {
  it('parses a CTA document without a bandTone', () => {
    const raw = makeRawCtaModule({ bandTone: null });

    expect(() => ctaModuleQuery.parse(raw)).not.toThrow();
  });

  it('resolves each text field in the requested language', async () => {
    const cta = await resolveCta(ctaDocument, NL);

    expect(cta).toMatchObject({
      eyebrow: 'Nieuwsbrief',
      headingBlock: { heading: 'Abonneer' },
      content: [{ children: [{ text: 'Lees verder.' }] }],
      image: { alt: 'Een brief' },
    });
  });

  it('falls back to the default-language value field by field', async () => {
    const cta = await resolveCta(ctaDocument, NL);

    expect(cta).toMatchObject({
      headingBlock: { supportingText: 'New posts weekly.' },
      footnote: 'Unsubscribe any time.',
    });
  });

  it('uses the default language for a language with no translations', async () => {
    const cta = await resolveCta(ctaDocument, FR);

    expect(cta).toMatchObject({
      eyebrow: 'Newsletter',
      headingBlock: { heading: 'Subscribe' },
      content: [{ children: [{ text: 'Read on.' }] }],
      image: { alt: 'A letter' },
    });
  });

  it('resolves a value missing in every language to nothing', async () => {
    const cta = await resolveCta(
      {
        ...ctaDocument,
        eyebrow: undefined,
        content: undefined,
        headingBlock: { _type: 'localizedHeadingBlock' },
      },
      NL,
    );

    expect(cta).toMatchObject({
      eyebrow: null,
      content: null,
      headingBlock: { heading: null, supportingText: null },
    });
  });
});
