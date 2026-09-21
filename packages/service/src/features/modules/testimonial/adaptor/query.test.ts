import { makeRawTestimonialModule } from '@blog/service/testing/modules/fixtures';

import { testimonialModuleQuery } from './query';

describe('testimonialModuleQuery', () => {
  it('filters to module_testimonial documents by id', () => {
    expect(testimonialModuleQuery.query).toContain(
      '_type == "module_testimonial"',
    );
    expect(testimonialModuleQuery.query).toContain('_id == $id');
  });

  it('rejects a module with no headingBlock', () => {
    const raw = { ...makeRawTestimonialModule(), headingBlock: null };

    expect(() => testimonialModuleQuery.parse(raw)).toThrow();
  });

  it('rejects a module with no cardAlignment', () => {
    const raw = { ...makeRawTestimonialModule(), cardAlignment: null };

    expect(() => testimonialModuleQuery.parse(raw)).toThrow();
  });

  it('derefs testimonials in authored order, preserving reference order', () => {
    expect(testimonialModuleQuery.query).toContain('testimonials[]->');
  });

  it('rejects a testimonial with no quote', () => {
    const raw = {
      ...makeRawTestimonialModule(),
      testimonials: [
        {
          _id: 'block-testimonial-1',
          quote: null,
          name: 'Jamie Rivera',
          role: null,
          photo: null,
          link: null,
        },
      ],
    };

    expect(() => testimonialModuleQuery.parse(raw)).toThrow();
  });

  it('rejects a testimonial with no name', () => {
    const raw = {
      ...makeRawTestimonialModule(),
      testimonials: [
        {
          _id: 'block-testimonial-1',
          quote: 'This changed how we ship.',
          name: null,
          role: null,
          photo: null,
          link: null,
        },
      ],
    };

    expect(() => testimonialModuleQuery.parse(raw)).toThrow();
  });

  it('parses a testimonial with no role, no photo and no link', () => {
    const raw = makeRawTestimonialModule({
      testimonials: [
        {
          _id: 'block-testimonial-1',
          quote: 'This changed how we ship.',
          name: 'Jamie Rivera',
          role: null,
          photo: null,
          link: null,
        },
      ],
    });

    expect(() => testimonialModuleQuery.parse(raw)).not.toThrow();
  });

  it('coalesces showImages to true for documents authored before the field existed', () => {
    expect(testimonialModuleQuery.query).toContain(
      'coalesce(showImages, true)',
    );
  });

  it('coalesces displayMode to GRID for documents authored before the field existed', () => {
    expect(testimonialModuleQuery.query).toContain(
      'coalesce(displayMode, "GRID")',
    );
  });

  it('projects contentAlignment and cardAlignment', () => {
    expect(testimonialModuleQuery.query).toContain('contentAlignment');
    expect(testimonialModuleQuery.query).toContain('cardAlignment');
  });
});
