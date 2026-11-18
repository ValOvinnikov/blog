import { CONTENT_ALIGNMENT } from '@shinefold/config/constants';
import { blockTestimonialSchema } from '@shinefold/studio/schema-types/documents/blocks/testimonial/testimonial';
import { cardModuleAppearance } from '@shinefold/studio/schema-types/fields/appearance-fields/appearance-fields';
import { cardAlignmentField } from '@shinefold/studio/schema-types/fields/card-alignment-field/card-alignment-field';
import { ctaButtonsField } from '@shinefold/studio/schema-types/fields/cta-buttons-field/cta-buttons-field';
import { titleField } from '@shinefold/studio/schema-types/fields/title-field/title-field';
import { moduleHeadingBlockField } from '@shinefold/studio/schema-types/objects/module-heading-block/module-heading-block-field';
import { moduleSubtitle } from '@shinefold/studio/schema-types/preview/module-subtitle/module-subtitle';
import { MessageSquareQuote } from 'lucide-react';
import { defineArrayMember, defineField, defineType } from 'sanity';

const NO_TESTIMONIALS_ERROR = 'Pick at least one testimonial.';

export const testimonialSchema = defineType({
  name: 'module_testimonial',
  title: 'Testimonials',
  type: 'document',
  description:
    'Quotes from clients or readers, shown as a single spotlight quote or a set of cards — used as social proof.',
  icon: MessageSquareQuote,
  ...cardModuleAppearance({
    content: [
      titleField(),
      moduleHeadingBlockField(),
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
          rule.required().error(NO_TESTIMONIALS_ERROR),
          rule.unique().error('Each testimonial can only appear once.'),
          rule.min(1).error(NO_TESTIMONIALS_ERROR),
          rule
            .max(8)
            .error('A testimonials module holds at most eight quotes.'),
        ],
      }),
      ctaButtonsField(),
    ],
    displayMode: {
      description:
        'Grid lays the cards out in rows. Carousel puts them in a single row the reader can swipe or step through. Ignored for a single quote.',
    },
    headingAlignment: {
      hasActions: true,
      allow: Object.values(CONTENT_ALIGNMENT),
    },
    afterHeadingAlignment: [
      cardAlignmentField({
        initialValue: CONTENT_ALIGNMENT.LEFT,
        hasSpotlight: true,
        isRequired: false,
      }),
    ],
  }),
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
