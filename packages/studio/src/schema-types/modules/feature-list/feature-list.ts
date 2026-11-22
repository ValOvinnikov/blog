import {
  CARD_IMAGE_SHAPE,
  CONTENT_ALIGNMENT,
} from '@shinefold/config/constants';
import { featureBlockSchema } from '@shinefold/studio/schema-types/documents/blocks/feature/feature';
import { cardModuleAppearance } from '@shinefold/studio/schema-types/fields/appearance-fields/appearance-fields';
import { cardAlignmentField } from '@shinefold/studio/schema-types/fields/card-alignment-field/card-alignment-field';
import { ctaButtonsField } from '@shinefold/studio/schema-types/fields/cta-buttons-field/cta-buttons-field';
import { imageShapeField } from '@shinefold/studio/schema-types/fields/image-shape-field/image-shape-field';
import { titleField } from '@shinefold/studio/schema-types/fields/title-field/title-field';
import { moduleHeadingBlockField } from '@shinefold/studio/schema-types/objects/module-heading-block/module-heading-block-field';
import { moduleSubtitle } from '@shinefold/studio/schema-types/preview/module-subtitle/module-subtitle';
import { isString, toTitleCase } from '@shinefold/utils/primitives';
import { Grid2x2 } from 'lucide-react';
import { defineArrayMember, defineField, defineType } from 'sanity';

export const featureListSchema = defineType({
  name: 'module_featureList',
  title: 'Features',
  type: 'document',
  description:
    'A grid of feature cards, each with its own heading, text, and icon or image — used to summarize a set of capabilities or offerings.',
  icon: Grid2x2,
  ...cardModuleAppearance({
    content: [
      titleField(),
      moduleHeadingBlockField(),
      defineField({
        name: 'features',
        title: 'Feature Cards',
        type: 'array',
        description:
          'The feature cards shown in this section, in display order.',
        of: [
          defineArrayMember({
            type: 'reference',
            to: [{ type: featureBlockSchema.name }],
          }),
        ],
        validation: (rule) => [
          rule.required().error('Add at least two feature cards.'),
          rule.unique().error('Each feature card can only appear once.'),
          rule
            .min(2)
            .error('A features section needs at least two feature cards.'),
          rule
            .max(8)
            .error('A features section holds at most eight feature cards.'),
        ],
      }),
      ctaButtonsField(),
    ],
    beforeDisplayMode: [
      imageShapeField({
        values: [
          CARD_IMAGE_SHAPE.WIDE,
          CARD_IMAGE_SHAPE.SQUARE,
          CARD_IMAGE_SHAPE.CIRCLE,
          CARD_IMAGE_SHAPE.ICON,
        ],
        initialValue: CARD_IMAGE_SHAPE.WIDE,
        subject: 'card image',
      }),
    ],
    displayMode: {
      description:
        'Grid lays the cards out in rows. Carousel puts them in a single row the reader can swipe or step through.',
    },
    headingAlignment: {
      allow: [CONTENT_ALIGNMENT.LEFT, CONTENT_ALIGNMENT.CENTER],
      hasActions: true,
      alignsCarousel: true,
    },
    afterHeadingAlignment: [
      cardAlignmentField({ initialValue: CONTENT_ALIGNMENT.LEFT }),
    ],
  }),
  preview: {
    select: {
      title: 'title',
      brandVariant: 'brandVariant',
      imageShape: 'imageShape',
    },
    prepare({ title, brandVariant, imageShape }) {
      return {
        title: title ?? 'Unknown',
        subtitle: moduleSubtitle(
          brandVariant,
          isString(imageShape) ? toTitleCase(imageShape) : undefined,
        ),
      };
    },
  },
});
