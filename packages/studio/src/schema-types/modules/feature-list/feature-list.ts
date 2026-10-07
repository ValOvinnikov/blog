import { CARD_IMAGE_SHAPE, CONTENT_ALIGNMENT } from '@blog/config/constants';
import { featureBlockSchema } from '@blog/studio/schema-types/documents/blocks/feature/feature';
import { alignmentFields } from '@blog/studio/schema-types/fields/alignment-fields/alignment-fields';
import { brandVariantField } from '@blog/studio/schema-types/fields/brand-variant-field/brand-variant-field';
import { cardAlignmentField } from '@blog/studio/schema-types/fields/card-alignment-field/card-alignment-field';
import { ctaButtonsField } from '@blog/studio/schema-types/fields/cta-buttons-field/cta-buttons-field';
import { displayModeField } from '@blog/studio/schema-types/fields/display-mode-field/display-mode-field';
import { imageShapeField } from '@blog/studio/schema-types/fields/image-shape-field/image-shape-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { moduleHeadingBlockField } from '@blog/studio/schema-types/objects/module-heading-block/module-heading-block-field';
import { wideLayoutField } from '@blog/studio/schema-types/objects/wide-layout/wide-layout-field';
import { moduleSubtitle } from '@blog/studio/schema-types/preview/module-subtitle/module-subtitle';
import { toTitleCase } from '@blog/utils/primitives';
import { Grid2x2 } from 'lucide-react';
import { defineArrayMember, defineField, defineType } from 'sanity';

export const featureListSchema = defineType({
  name: 'module_featureList',
  title: 'Features',
  type: 'document',
  description:
    'A grid of feature cards, each with its own heading, text, and icon or image — used to summarize a set of capabilities or offerings.',
  icon: Grid2x2,
  fields: [
    titleField(),
    brandVariantField(),
    moduleHeadingBlockField(),
    defineField({
      name: 'features',
      title: 'Feature Cards',
      type: 'array',
      description: 'The feature cards shown in this section, in display order.',
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
    imageShapeField({
      values: Object.values(CARD_IMAGE_SHAPE),
      initialValue: CARD_IMAGE_SHAPE.WIDE,
      subject: 'card image',
    }),
    displayModeField({
      description:
        'Grid lays the cards out in rows. Carousel puts them in a single row the reader can swipe or step through.',
    }),
    ...alignmentFields([], {
      allow: [CONTENT_ALIGNMENT.LEFT, CONTENT_ALIGNMENT.CENTER],
      hasActions: true,
      alignsCarousel: true,
    }),
    cardAlignmentField({ initialValue: CONTENT_ALIGNMENT.LEFT }),
    wideLayoutField,
  ],
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
          typeof imageShape === 'string' ? toTitleCase(imageShape) : undefined,
        ),
      };
    },
  },
});
