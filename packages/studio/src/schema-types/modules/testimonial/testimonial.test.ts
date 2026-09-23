import { testimonialSchema } from '@blog/studio/schema-types/modules/testimonial/testimonial';

describe('testimonialSchema preview', () => {
  const prepare = testimonialSchema.preview?.prepare;

  if (!prepare) {
    throw new Error('Expected testimonialSchema to define preview.prepare.');
  }

  it.each([
    [
      {
        title: 'What clients say',
        brandVariant: 'PRIMARY',
        testimonials: [{ _ref: 'testimonial-1' }, { _ref: 'testimonial-2' }],
      },
      { title: 'What clients say', subtitle: 'Primary · 2 testimonials' },
    ],
    [
      {
        title: 'Spotlight',
        brandVariant: 'SECONDARY',
        testimonials: [{ _ref: 'testimonial-1' }],
      },
      { title: 'Spotlight', subtitle: 'Secondary · 1 testimonial' },
    ],
    [
      { title: undefined, brandVariant: undefined, testimonials: undefined },
      { title: 'Unknown', subtitle: '0 testimonials' },
    ],
  ])('prepares %j', (input, expected) => {
    expect(prepare(input)).toEqual(expected);
  });
});
