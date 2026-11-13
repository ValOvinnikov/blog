import { CONTENT_ALIGNMENT } from '@blog/config/constants';
import { blockTestimonialSchema } from '@blog/studio/schema-types/documents/blocks/testimonial/testimonial';
import { alignmentFields } from '@blog/studio/schema-types/fields/alignment-fields/alignment-fields';
import {
  appearanceFieldGroups,
  appearanceFields,
  appearanceFieldsets,
} from '@blog/studio/schema-types/fields/appearance-fields/appearance-fields';
import { brandVariantField } from '@blog/studio/schema-types/fields/brand-variant-field/brand-variant-field';
import { cardAlignmentField } from '@blog/studio/schema-types/fields/card-alignment-field/card-alignment-field';
import { ctaButtonsField } from '@blog/studio/schema-types/fields/cta-buttons-field/cta-buttons-field';
import {
  displayModeField,
  isCarouselMode,
} from '@blog/studio/schema-types/fields/display-mode-field/display-mode-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { moduleHeadingBlockField } from '@blog/studio/schema-types/objects/module-heading-block/module-heading-block-field';
import { wideLayoutField } from '@blog/studio/schema-types/objects/wide-layout/wide-layout-field';
import { moduleSubtitle } from '@blog/studio/schema-types/preview/module-subtitle/module-subtitle';
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
  fieldsets: appearanceFieldsets,
  groups: appearanceFieldGroups,
  fields: appearanceFields({
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
    appearance: [
      brandVariantField(),
      displayModeField({
        description:
          'Grid lays the cards out in rows. Carousel puts them in a single row the reader can swipe or step through. Ignored for a single quote.',
      }),
      ...alignmentFields([], {
        title: 'Heading Alignment',
        hasActions: true,
        allow: Object.values(CONTENT_ALIGNMENT),
      }),
      cardAlignmentField({
        initialValue: CONTENT_ALIGNMENT.LEFT,
        hasSpotlight: true,
        isRequired: false,
      }),
    ],
    layout: wideLayoutField,
    columnsHidden: isCarouselMode,
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
