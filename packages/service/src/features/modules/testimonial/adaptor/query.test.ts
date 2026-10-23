import {
  BRAND_VARIANT,
  CONTENT_ALIGNMENT,
  DISPLAY_MODE,
  LOCALE_ISO_CODES,
} from '@blog/config/constants';
import {
  MOCK_TESTIMONIAL_MODULE_ID,
  mockRawTestimonialModule,
} from '@blog/service/testing/modules/fixtures';
import {
  mockRawPortableTextMarkDef,
  mockReference,
} from '@blog/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import {
  MOCK_IMAGE_ASSET_DOCUMENT,
  mockLocalizedHeadingBlock,
  mockLocalizedImage,
  mockLocalizedListedText,
  mockLocalizedStrings,
} from '@blog/service/testing/shared/localized';

import { testimonialModuleQuery } from './query';

const { EN, NL, FR } = LOCALE_ISO_CODES;

const TRANSLATED_ID = 'block-testimonial-1';
const UNTRANSLATED_ID = 'block-testimonial-2';
const HEADING = { [EN]: 'What people say', [NL]: 'Wat mensen zeggen' };
const QUOTE = { [EN]: 'They shipped on time.', [NL]: 'Ze leverden op tijd.' };
const ROLE = { [EN]: 'Founder, Acme', [NL]: 'Oprichter, Acme' };
const ALT = { [EN]: 'Jane smiling', [NL]: 'Jane lacht' };
const UNTRANSLATED_QUOTE = 'A pleasure to work with.';
const [FIRST_ITEM] = mockRawTestimonialModule().testimonials ?? [];

const testimonialModuleDocument = {
  _id: MOCK_TESTIMONIAL_MODULE_ID,
  _type: 'module_testimonial',
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: mockLocalizedHeadingBlock(HEADING),
  testimonials: [
    mockReference(TRANSLATED_ID, { _key: 't-1' }),
    mockReference(UNTRANSLATED_ID, { _key: 't-2' }),
  ],
};

const translatedTestimonial = {
  _id: TRANSLATED_ID,
  _type: 'block_testimonial',
  name: 'Jane Doe',
  quote: mockLocalizedListedText(QUOTE),
  role: mockLocalizedStrings(ROLE),
  image: mockLocalizedImage(ALT),
};

const untranslatedTestimonial = {
  _id: UNTRANSLATED_ID,
  _type: 'block_testimonial',
  name: 'Sam Lee',
  quote: mockLocalizedListedText({ [EN]: UNTRANSLATED_QUOTE }),
  role: mockLocalizedStrings({ [EN]: 'Editor' }),
};

async function runTestimonial(
  locale: string,
  moduleDocument: Record<string, unknown> = testimonialModuleDocument,
) {
  const raw = await evaluateGroqExpression(
    testimonialModuleQuery.query,
    [
      moduleDocument,
      translatedTestimonial,
      untranslatedTestimonial,
      MOCK_IMAGE_ASSET_DOCUMENT,
    ],
    undefined,
    { id: MOCK_TESTIMONIAL_MODULE_ID, locale, defaultLocale: EN },
  );

  return testimonialModuleQuery.parse(raw);
}

function testimonialText(module: Awaited<ReturnType<typeof runTestimonial>>) {
  return module.testimonials.map(({ name, quote, role, image }) => ({
    name,
    quote: quote.map((block) => block.children?.map(({ text }) => text)),
    role,
    alt: image?.alt ?? null,
  }));
}

describe('testimonialModuleQuery', () => {
  it('filters to module_testimonial documents by id', () => {
    expect(testimonialModuleQuery.query).toContain(
      '_type == "module_testimonial"',
    );
    expect(testimonialModuleQuery.query).toContain('_id == $id');
  });

  it('parses a module with a fully populated quote', () => {
    const raw = mockRawTestimonialModule();

    expect(() => testimonialModuleQuery.parse(raw)).not.toThrow();
  });

  it.each([
    ['a module with no headingBlock', { headingBlock: null }],
    ['a module with no testimonials', { testimonials: null }],
    ['an item with no name', { testimonials: [{ ...FIRST_ITEM, name: null }] }],
    [
      'an item with no quote',
      { testimonials: [{ ...FIRST_ITEM, quote: null }] },
    ],
  ])('rejects %s', (_case, overrides) => {
    const raw = { ...mockRawTestimonialModule(), ...overrides };

    expect(() => testimonialModuleQuery.parse(raw)).toThrow();
  });

  it('keeps a resolved inline link mark inside the quote', () => {
    const markDef = mockRawPortableTextMarkDef();
    const raw = {
      ...mockRawTestimonialModule(),
      testimonials: [
        {
          ...FIRST_ITEM,
          quote: [
            {
              _type: 'block' as const,
              _key: 'block-1',
              style: 'normal' as const,
              children: [
                {
                  _type: 'span' as const,
                  _key: 'span-1',
                  text: 'the case study',
                },
              ],
              markDefs: [markDef],
            },
          ],
        },
      ],
    };

    const parsed = testimonialModuleQuery.parse(raw);

    expect(parsed.testimonials[0]?.quote[0]?.markDefs).toEqual([markDef]);
  });

  it.each([
    [NL, NL],
    [FR, EN],
  ])(
    'resolves a %s visitor to the %s heading and testimonials',
    async (locale, language) => {
      const module = await runTestimonial(locale);

      expect(module.headingBlock.heading).toBe(HEADING[language]);
      expect(testimonialText(module)).toEqual([
        {
          name: 'Jane Doe',
          quote: [[QUOTE[language]]],
          role: ROLE[language],
          alt: ALT[language],
        },
        {
          name: 'Sam Lee',
          quote: [[UNTRANSLATED_QUOTE]],
          role: 'Editor',
          alt: null,
        },
      ]);
    },
  );

  it('reads an unset displayMode as Grid and cardAlignment as Left', async () => {
    const { displayMode, cardAlignment } = await runTestimonial(EN);

    expect(displayMode).toBe(DISPLAY_MODE.GRID);
    expect(cardAlignment).toBe(CONTENT_ALIGNMENT.LEFT);
  });

  it('keeps an authored Center cardAlignment', async () => {
    const module = await runTestimonial(EN, {
      ...testimonialModuleDocument,
      cardAlignment: CONTENT_ALIGNMENT.CENTER,
    });

    expect(module.cardAlignment).toBe(CONTENT_ALIGNMENT.CENTER);
  });
});
