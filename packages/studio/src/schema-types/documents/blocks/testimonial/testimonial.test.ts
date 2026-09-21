import { blockTestimonialSchema } from '@blog/studio/schema-types/documents/blocks/testimonial/testimonial';
import { getRecordedBounds } from '@blog/studio/testing/create-mock-validation-rule';
import { getField } from '@blog/studio/testing/get-field';

describe('blockTestimonialSchema quote field validation', () => {
  it('is required and warns past 280 characters', () => {
    const quoteField = getField(blockTestimonialSchema, 'quote');

    expect(getRecordedBounds(quoteField)).toEqual({
      required: true,
      max: 280,
    });
  });
});

describe('blockTestimonialSchema name field validation', () => {
  it('is required', () => {
    const nameField = getField(blockTestimonialSchema, 'name');

    expect(getRecordedBounds(nameField)).toEqual({ required: true });
  });
});

describe('blockTestimonialSchema preview', () => {
  const prepare = blockTestimonialSchema.preview?.prepare;

  if (!prepare) {
    throw new Error(
      'Expected blockTestimonialSchema to define preview.prepare.',
    );
  }

  it.each([
    [
      {
        title: 'Ships value every sprint.',
        name: 'Jane Doe',
        role: 'CEO, Acme',
        media: undefined,
      },
      {
        title: 'Ships value every sprint.',
        subtitle: 'Jane Doe — CEO, Acme',
        media: undefined,
      },
    ],
    [
      {
        title: 'Ships value every sprint.',
        name: 'Jane Doe',
        role: undefined,
        media: undefined,
      },
      {
        title: 'Ships value every sprint.',
        subtitle: 'Jane Doe',
        media: undefined,
      },
    ],
    [
      { title: undefined, name: undefined, role: undefined, media: undefined },
      { title: 'Untitled Testimonial', subtitle: 'Unknown', media: undefined },
    ],
    [
      {
        title: 'Ships value every sprint.',
        name: 'Jane Doe',
        role: undefined,
        media: { asset: { _ref: 'image-abc' } },
      },
      {
        title: 'Ships value every sprint.',
        subtitle: 'Jane Doe',
        media: { asset: { _ref: 'image-abc' } },
      },
    ],
  ])('prepares %j', (input, expected) => {
    expect(prepare(input)).toEqual(expected);
  });
});
