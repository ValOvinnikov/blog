import { makeRawTestimonialModule } from '@blog/service/testing/modules/fixtures';
import { makeRawExternalLinkDocument } from '@blog/service/testing/shared/fixtures';

import { testimonialModuleQuery } from './query';

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
});
