import { CARD_IMAGE_SHAPE, CONTENT_ALIGNMENT } from '@blog/config/constants';
import { featureBlockSchema } from '@blog/studio/schema-types/documents/blocks/feature/feature';
import { alignmentFields } from '@blog/studio/schema-types/fields/alignment-fields/alignment-fields';
import { brandVariantField } from '@blog/studio/schema-types/fields/brand-variant-field/brand-variant-field';
import { ctaButtonsField } from '@blog/studio/schema-types/fields/cta-buttons-field/cta-buttons-field';
import { displayModeField } from '@blog/studio/schema-types/fields/display-mode-field/display-mode-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { headingBlockField } from '@blog/studio/schema-types/objects/heading-block/heading-block-field';
import { layoutField } from '@blog/studio/schema-types/objects/layout/layout-field';
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
    headingBlockField(),
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
      validation: (rule) =>
        rule
          .unique()
          .min(2)
          .error('A features section needs at least two feature cards.')
          .max(8)
          .error('A features section holds at most eight feature cards.'),
    }),
    ctaButtonsField(),
    defineField({
      name: 'imageShape',
      title: 'Image Shape',
      type: 'string',
      description:
        "How each card's image is cropped — wide, square, or circular. A card with no image shows its icon instead, regardless of this setting.",
      options: {
        layout: 'dropdown',
        list: Object.values(CARD_IMAGE_SHAPE).map((value) => ({
          title: toTitleCase(value),
          value,
        })),
      },
      initialValue: CARD_IMAGE_SHAPE.WIDE,
      validation: (rule) => rule.required(),
    }),
    displayModeField({
      description:
        'Grid lays the cards out in rows. Carousel puts them in a single row the reader can swipe or step through.',
    }),
    ...alignmentFields([], {
      description:
        'Horizontal alignment of the heading, supporting text and actions. Cards have their own alignment.',
    }),
    defineField({
      name: 'cardAlignment',
      title: 'Card Alignment',
      type: 'string',
      description:
        'Horizontal alignment of the heading and text within each feature card.',
      options: {
        layout: 'dropdown',
        list: [CONTENT_ALIGNMENT.LEFT, CONTENT_ALIGNMENT.CENTER].map(
          (value) => ({ title: toTitleCase(value), value }),
        ),
      },
      initialValue: CONTENT_ALIGNMENT.LEFT,
      validation: (rule) => rule.required(),
    }),
    layoutField,
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
