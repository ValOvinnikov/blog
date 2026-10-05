import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { makeRawTestimonialModule } from '@blog/service/testing/modules/fixtures';
import { makeRawExternalLinkDocument } from '@blog/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import {
  localizedStrings,
  localizedValues,
  paragraphBlocks,
} from '@blog/service/testing/shared/localized';

import { testimonialModuleQuery } from './query';

const { EN, NL, FR } = LOCALE_ISO_CODES;

function localizedQuote(values: Record<string, string>) {
  return localizedValues(
    'internationalizedArrayListedTextValue',
    Object.fromEntries(
      Object.entries(values).map(([language, text]) => [
        language,
        paragraphBlocks(text),
      ]),
    ),
  );
}

const testimonialModuleDocument = {
  _id: 'testimonial-1',
  _type: 'module_testimonial',
  brandVariant: 'PRIMARY',
  headingBlock: {
    _type: 'localizedHeadingBlock',
    heading: localizedStrings({
      [EN]: 'What people say',
      [NL]: 'Wat mensen zeggen',
    }),
  },
  testimonials: [
    { _key: 't-1', _type: 'reference', _ref: 'block-testimonial-1' },
    { _key: 't-2', _type: 'reference', _ref: 'block-testimonial-2' },
  ],
};

const translatedTestimonial = {
  _id: 'block-testimonial-1',
  _type: 'block_testimonial',
  name: 'Jane Doe',
  quote: localizedQuote({
    [EN]: 'They shipped on time.',
    [NL]: 'Ze leverden op tijd.',
  }),
  role: localizedStrings({ [EN]: 'Founder, Acme', [NL]: 'Oprichter, Acme' }),
  image: {
    _type: 'localizedImageWithAlt',
    asset: { _type: 'reference', _ref: 'image-1' },
    alt: localizedStrings({ [EN]: 'Jane smiling', [NL]: 'Jane lacht' }),
  },
};

const untranslatedTestimonial = {
  _id: 'block-testimonial-2',
  _type: 'block_testimonial',
  name: 'Sam Lee',
  quote: localizedQuote({ [EN]: 'A pleasure to work with.' }),
  role: localizedStrings({ [EN]: 'Editor' }),
};

const imageAsset = { _id: 'image-1', _type: 'sanity.imageAsset' };

async function runTestimonial(locale: string) {
  const raw = await evaluateGroqExpression(
    testimonialModuleQuery.query,
    [
      testimonialModuleDocument,
      translatedTestimonial,
      untranslatedTestimonial,
      imageAsset,
    ],
    undefined,
    { id: 'testimonial-1', locale, defaultLocale: EN },
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
    const raw = makeRawTestimonialModule();

    expect(() => testimonialModuleQuery.parse(raw)).not.toThrow();
  });

  it('rejects a module with no headingBlock', () => {
    const raw = { ...makeRawTestimonialModule(), headingBlock: null };

    expect(() => testimonialModuleQuery.parse(raw)).toThrow();
  });

  it('rejects a module with no testimonials', () => {
    const raw = { ...makeRawTestimonialModule(), testimonials: null };

    expect(() => testimonialModuleQuery.parse(raw)).toThrow();
  });

  it('rejects a testimonial item with no name', () => {
    const [firstItem] = makeRawTestimonialModule().testimonials ?? [];
    if (!firstItem) throw new Error('expected a fixture testimonial item');

    const raw = {
      ...makeRawTestimonialModule(),
      testimonials: [{ ...firstItem, name: null }],
    };

    expect(() => testimonialModuleQuery.parse(raw)).toThrow();
  });

  it('rejects a testimonial item with no quote', () => {
    const [firstItem] = makeRawTestimonialModule().testimonials ?? [];
    if (!firstItem) throw new Error('expected a fixture testimonial item');

    const raw = {
      ...makeRawTestimonialModule(),
      testimonials: [{ ...firstItem, quote: null }],
    };

    expect(() => testimonialModuleQuery.parse(raw)).toThrow();
  });

  it('defaults displayMode to GRID at read time', () => {
    expect(testimonialModuleQuery.query).toContain(
      'coalesce(displayMode, "GRID")',
    );
  });

  it('keeps a resolved inline link mark inside the quote', () => {
    const [firstItem] = makeRawTestimonialModule().testimonials ?? [];
    if (!firstItem) throw new Error('expected a fixture testimonial item');

    const raw = {
      ...makeRawTestimonialModule(),
      testimonials: [
        {
          ...firstItem,
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
              markDefs: [
                {
                  _key: 'mark-1',
                  _type: 'linkRef' as const,
                  link: makeRawExternalLinkDocument(),
                },
              ],
            },
          ],
        },
      ],
    };

    const parsed = testimonialModuleQuery.parse(raw);

    expect(parsed.testimonials?.[0]?.quote[0]?.markDefs?.[0]).toMatchObject({
      _key: 'mark-1',
    });
  });

  it('picks the heading and each quote, role and photo alt in the visitor language', async () => {
    const module = await runTestimonial(NL);

    expect(module.headingBlock.heading).toBe('Wat mensen zeggen');
    expect(testimonialText(module)).toEqual([
      {
        name: 'Jane Doe',
        quote: [['Ze leverden op tijd.']],
        role: 'Oprichter, Acme',
        alt: 'Jane lacht',
      },
      {
        name: 'Sam Lee',
        quote: [['A pleasure to work with.']],
        role: 'Editor',
        alt: null,
      },
    ]);
  });

  it('falls back to the default language for the heading and each testimonial', async () => {
    const module = await runTestimonial(FR);

    expect(module.headingBlock.heading).toBe('What people say');
    expect(testimonialText(module)).toEqual([
      {
        name: 'Jane Doe',
        quote: [['They shipped on time.']],
        role: 'Founder, Acme',
        alt: 'Jane smiling',
      },
      {
        name: 'Sam Lee',
        quote: [['A pleasure to work with.']],
        role: 'Editor',
        alt: null,
      },
    ]);
  });
});
