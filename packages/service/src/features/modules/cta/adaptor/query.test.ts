import { BRAND_VARIANT, CTA_VARIANT } from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  MOCK_CTA_MODULE_ID,
  mockRawCtaModule,
} from '@blog/service/testing/modules/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import {
  MOCK_DUTCH_TEXT,
  MOCK_ENGLISH_TEXT,
  MOCK_IMAGE_ASSET_DOCUMENT,
  mockLocalizedHeadingBlock,
  mockLocalizedImage,
  mockLocalizedListedText,
  mockLocalizedStrings,
  mockLocalizedValues,
} from '@blog/service/testing/shared/localized';

import { ctaModuleQuery } from './query';

const { EN, NL, FR } = LOCALE_ISO_CODES;

const EN_COPY = {
  eyebrow: 'Newsletter',
  heading: 'Subscribe',
  supportingText: 'New posts weekly.',
  footnote: 'Unsubscribe any time.',
  alt: 'A letter',
  content: MOCK_ENGLISH_TEXT,
};

const NL_COPY = {
  eyebrow: 'Nieuwsbrief',
  heading: 'Abonneer',
  supportingText: 'Wekelijks nieuwe berichten.',
  footnote: 'Altijd opzegbaar.',
  alt: 'Een brief',
  content: MOCK_DUTCH_TEXT,
};

const ctaDocument = {
  _id: MOCK_CTA_MODULE_ID,
  _type: 'module_cta',
  variant: CTA_VARIANT.SPLIT,
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: mockLocalizedHeadingBlock(
    {
      [EN]: EN_COPY.heading,
      [NL]: NL_COPY.heading,
    },
    {
      supportingText: mockLocalizedValues('internationalizedArrayTextValue', {
        [EN]: EN_COPY.supportingText,
        [NL]: NL_COPY.supportingText,
      }),
    },
  ),
  footnote: mockLocalizedStrings({
    [EN]: EN_COPY.footnote,
    [NL]: NL_COPY.footnote,
  }),
  image: mockLocalizedImage({ [EN]: EN_COPY.alt, [NL]: NL_COPY.alt }),
  eyebrow: mockLocalizedStrings({
    [EN]: EN_COPY.eyebrow,
    [NL]: NL_COPY.eyebrow,
  }),
  content: mockLocalizedListedText({
    [EN]: EN_COPY.content,
    [NL]: NL_COPY.content,
  }),
};

async function runCta(document: Record<string, unknown>, locale: string) {
  const raw = await evaluateGroqExpression(
    ctaModuleQuery.query,
    [document, MOCK_IMAGE_ASSET_DOCUMENT],
    undefined,
    { id: MOCK_CTA_MODULE_ID, locale, defaultLocale: EN },
  );

  return ctaModuleQuery.parse(raw);
}

describe('ctaModuleQuery', () => {
  it('parses a CTA document without a bandTone', () => {
    const raw = mockRawCtaModule({ bandTone: null });

    expect(() => ctaModuleQuery.parse(raw)).not.toThrow();
  });

  it.each([
    ['picks them in the visitor language', NL, NL_COPY],
    ['falls back to the default language', FR, EN_COPY],
  ])(
    'eyebrow, heading, footnote, image alt and content: %s',
    async (_, locale, copy) => {
      const cta = await runCta(ctaDocument, locale);

      expect(cta).toMatchObject({
        eyebrow: copy.eyebrow,
        headingBlock: {
          heading: copy.heading,
          supportingText: copy.supportingText,
        },
        footnote: copy.footnote,
        image: { alt: copy.alt },
        content: [{ children: [{ text: copy.content }] }],
      });
    },
  );

  it('leaves optional localized fields null when no language has a value', async () => {
    const cta = await runCta(
      {
        ...ctaDocument,
        eyebrow: undefined,
        content: undefined,
        footnote: undefined,
        headingBlock: mockLocalizedHeadingBlock({ [EN]: EN_COPY.heading }),
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

  it('loads the image with a null alt when it has no alt in either language', async () => {
    const cta = await runCta(
      {
        ...ctaDocument,
        image: { ...ctaDocument.image, alt: undefined },
      },
      NL,
    );

    expect(cta).toMatchObject({ image: { alt: null } });
  });

  it('fails when the heading is missing in both languages', async () => {
    await expect(
      runCta(
        {
          ...ctaDocument,
          headingBlock: { _type: 'moduleHeadingBlock' },
        },
        NL,
      ),
    ).rejects.toThrow();
  });
});
