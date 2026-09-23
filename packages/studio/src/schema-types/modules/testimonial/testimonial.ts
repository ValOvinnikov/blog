import { CONTENT_ALIGNMENT } from '@blog/config/constants';
import { blockTestimonialSchema } from '@blog/studio/schema-types/documents/blocks/testimonial/testimonial';
import { alignmentFields } from '@blog/studio/schema-types/fields/alignment-fields/alignment-fields';
import { brandVariantField } from '@blog/studio/schema-types/fields/brand-variant-field/brand-variant-field';
import { ctaButtonsField } from '@blog/studio/schema-types/fields/cta-buttons-field/cta-buttons-field';
import { displayModeField } from '@blog/studio/schema-types/fields/display-mode-field/display-mode-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { headingBlockField } from '@blog/studio/schema-types/objects/heading-block/heading-block-field';
import { layoutField } from '@blog/studio/schema-types/objects/layout/layout-field';
import { moduleSubtitle } from '@blog/studio/schema-types/preview/module-subtitle/module-subtitle';
import { MessageSquareQuote } from 'lucide-react';
import { defineArrayMember, defineField, defineType } from 'sanity';

export const testimonialSchema = defineType({
  name: 'module_testimonial',
  title: 'Testimonials',
  type: 'document',
  description:
    'Quotes from clients or readers, shown as a single spotlight quote or a set of cards — used as social proof.',
  icon: MessageSquareQuote,
  fields: [
    titleField(),
    brandVariantField(),
    headingBlockField(),
    defineField({
      name: 'testimonials',
      title: 'Testimonials',
      type: 'array',
      description:
        'Pick the quotes to show, in order. One quote renders as a single spotlight; two or more as cards.',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{ type: blockTestimonialSchema.name }],
        }),
      ],
      validation: (rule) => [
        rule.required().unique().min(1).error('Pick at least one testimonial.'),
        rule.max(8).error('A testimonials module holds at most eight quotes.'),
      ],
    }),
    ctaButtonsField(),
    displayModeField({
      description:
        'Grid lays the cards out in rows. Carousel puts them in a single row the reader can swipe or step through. Ignored for a single quote.',
    }),
    ...alignmentFields(
      [
        {
          name: 'cardAlignment',
          title: 'Card Alignment',
          description: 'Aligns the quote and the person inside each card.',
          allow: [CONTENT_ALIGNMENT.LEFT, CONTENT_ALIGNMENT.CENTER],
          initialValue: CONTENT_ALIGNMENT.LEFT,
        },
      ],
      {
        description:
          'Horizontal alignment of the heading, supporting text and actions. Cards have their own alignment.',
      },
    ),
    layoutField,
  ],
  preview: {
    select: {
      title: 'title',
      brandVariant: 'brandVariant',
      testimonials: 'testimonials',
    },
    prepare({ title, brandVariant, testimonials }) {
      const count = Array.isArray(testimonials) ? testimonials.length : 0;

      return {
        title: title ?? 'Unknown',
        subtitle: moduleSubtitle(
          brandVariant,
          `${String(count)} testimonial${count === 1 ? '' : 's'}`,
        ),
      };
    },
  },
});
