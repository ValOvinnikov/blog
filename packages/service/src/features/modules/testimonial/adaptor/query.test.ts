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
import { faker } from '@faker-js/faker';

import { testimonialModuleQuery } from './query';

faker.seed(6014);

const { EN, NL, FR } = LOCALE_ISO_CODES;

const MOCK_TRANSLATED_ID = faker.string.uuid();
const MOCK_UNTRANSLATED_ID = faker.string.uuid();
const MOCK_FIRST_REFERENCE_KEY = faker.string.uuid();
const MOCK_SECOND_REFERENCE_KEY = faker.string.uuid();
const MOCK_TRANSLATED_NAME = faker.person.fullName();
const MOCK_UNTRANSLATED_NAME = faker.person.fullName();
const MOCK_HEADING = {
  [EN]: faker.lorem.words(3),
  [NL]: faker.lorem.words(3),
};
const MOCK_QUOTE = {
  [EN]: faker.lorem.sentence(),
  [NL]: faker.lorem.sentence(),
};
const MOCK_ROLE = {
  [EN]: faker.person.jobTitle(),
  [NL]: faker.person.jobTitle(),
};
const MOCK_ALT = { [EN]: faker.lorem.words(2), [NL]: faker.lorem.words(2) };
const MOCK_UNTRANSLATED_QUOTE = faker.lorem.sentence();
const MOCK_UNTRANSLATED_ROLE = faker.person.jobTitle();
const MOCK_MARKED_TEXT = faker.lorem.words(2);
const [FIRST_ITEM] = mockRawTestimonialModule().testimonials ?? [];

const MOCK_TESTIMONIAL_MODULE_DOCUMENT = {
  _id: MOCK_TESTIMONIAL_MODULE_ID,
  _type: 'module_testimonial',
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: mockLocalizedHeadingBlock(MOCK_HEADING),
  testimonials: [
    mockReference(MOCK_TRANSLATED_ID, { _key: MOCK_FIRST_REFERENCE_KEY }),
    mockReference(MOCK_UNTRANSLATED_ID, { _key: MOCK_SECOND_REFERENCE_KEY }),
  ],
};

const MOCK_TRANSLATED_TESTIMONIAL = {
  _id: MOCK_TRANSLATED_ID,
  _type: 'block_testimonial',
  name: MOCK_TRANSLATED_NAME,
  quote: mockLocalizedListedText(MOCK_QUOTE),
  role: mockLocalizedStrings(MOCK_ROLE),
  image: mockLocalizedImage(MOCK_ALT),
};

const MOCK_UNTRANSLATED_TESTIMONIAL = {
  _id: MOCK_UNTRANSLATED_ID,
  _type: 'block_testimonial',
  name: MOCK_UNTRANSLATED_NAME,
  quote: mockLocalizedListedText({ [EN]: MOCK_UNTRANSLATED_QUOTE }),
  role: mockLocalizedStrings({ [EN]: MOCK_UNTRANSLATED_ROLE }),
};

async function runTestimonial(
  locale: string,
  moduleDocument: Record<string, unknown> = MOCK_TESTIMONIAL_MODULE_DOCUMENT,
) {
  const raw = await evaluateGroqExpression(
    testimonialModuleQuery.query,
    [
      moduleDocument,
      MOCK_TRANSLATED_TESTIMONIAL,
      MOCK_UNTRANSLATED_TESTIMONIAL,
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
              _key: faker.string.uuid(),
              style: 'normal' as const,
              children: [
                {
                  _type: 'span' as const,
                  _key: faker.string.uuid(),
                  text: MOCK_MARKED_TEXT,
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

      expect(module.headingBlock.heading).toBe(MOCK_HEADING[language]);
      expect(testimonialText(module)).toEqual([
        {
          name: MOCK_TRANSLATED_NAME,
          quote: [[MOCK_QUOTE[language]]],
          role: MOCK_ROLE[language],
          alt: MOCK_ALT[language],
        },
        {
          name: MOCK_UNTRANSLATED_NAME,
          quote: [[MOCK_UNTRANSLATED_QUOTE]],
          role: MOCK_UNTRANSLATED_ROLE,
          alt: null,
        },
      ]);
    },
  );

  it('reads an unset displayMode as Grid', async () => {
    const { displayMode } = await runTestimonial(EN);

    expect(displayMode).toBe(DISPLAY_MODE.GRID);
  });

  it.each([
    ['unset', undefined, CONTENT_ALIGNMENT.LEFT],
    ['an authored Center', CONTENT_ALIGNMENT.CENTER, CONTENT_ALIGNMENT.CENTER],
  ])('reads %s cardAlignment as %s', async (_case, authored, expected) => {
    const { cardAlignment } = await runTestimonial(EN, {
      ...MOCK_TESTIMONIAL_MODULE_DOCUMENT,
      cardAlignment: authored,
    });

    expect(cardAlignment).toBe(expected);
  });
});
