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
      [NL]: 'Wekelijks nieuwe berichten.',
    }),
  },
  footnote: strings({
    [EN]: 'Unsubscribe any time.',
    [NL]: 'Altijd opzegbaar.',
  }),
  image: {
    _type: 'localizedImageWithAlt',
    asset: { _type: 'reference', _ref: 'image-1' },
    alt: strings({ [EN]: 'A letter', [NL]: 'Een brief' }),
  },
  eyebrow: strings({ [EN]: 'Newsletter', [NL]: 'Nieuwsbrief' }),
  content: localized('internationalizedArrayListedTextValue', {
    [EN]: paragraph('Read on.'),
    [NL]: paragraph('Lees verder.'),
  }),
};

const imageAsset = { _id: 'image-1', _type: 'sanity.imageAsset' };

async function runCta(document: Record<string, unknown>, locale: string) {
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

  it('picks eyebrow, heading and content in the visitor language', async () => {
    const cta = await runCta(ctaDocument, NL);

    expect(cta).toMatchObject({
      eyebrow: 'Nieuwsbrief',
      headingBlock: {
        heading: 'Abonneer',
        supportingText: 'Wekelijks nieuwe berichten.',
      },
      footnote: 'Altijd opzegbaar.',
      image: { alt: 'Een brief' },
      content: [{ children: [{ text: 'Lees verder.' }] }],
    });
  });

  it('falls back to the default language for eyebrow, heading and content', async () => {
    const cta = await runCta(ctaDocument, FR);

    expect(cta).toMatchObject({
      eyebrow: 'Newsletter',
      headingBlock: {
        heading: 'Subscribe',
        supportingText: 'New posts weekly.',
      },
      footnote: 'Unsubscribe any time.',
      image: { alt: 'A letter' },
      content: [{ children: [{ text: 'Read on.' }] }],
    });
  });

  it('leaves optional localized fields null when no language has a value', async () => {
    const cta = await runCta(
      {
        ...ctaDocument,
        eyebrow: undefined,
        content: undefined,
        footnote: undefined,
        headingBlock: {
          _type: 'localizedHeadingBlock',
          heading: strings({ [EN]: 'Subscribe' }),
        },
      },
      NL,
    );

    expect(cta).toMatchObject({
      eyebrow: null,
      content: null,
      footnote: null,
      headingBlock: { supportingText: null },
    });
  });

  it('fails when the image has no alt in either language', async () => {
    await expect(
      runCta(
        {
          ...ctaDocument,
          image: { ...ctaDocument.image, alt: undefined },
        },
        NL,
      ),
    ).rejects.toThrow();
  });

  it('fails when the heading is missing in both languages', async () => {
    await expect(
      runCta(
        {
          ...ctaDocument,
          headingBlock: { _type: 'localizedHeadingBlock' },
        },
        NL,
      ),
    ).rejects.toThrow();
  });
});
