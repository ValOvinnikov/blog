import { MEDIA_ORDER } from '@blog/config/constants';
import { alignmentFields } from '@blog/studio/schema-types/fields/alignment-fields/alignment-fields';
import { brandVariantField } from '@blog/studio/schema-types/fields/brand-variant-field/brand-variant-field';
import { ctaButtonsField } from '@blog/studio/schema-types/fields/cta-buttons-field/cta-buttons-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { featureHighlightSchema } from '@blog/studio/schema-types/objects/feature-highlight/feature-highlight';
import { headingBlockField } from '@blog/studio/schema-types/objects/heading-block/heading-block-field';
import { layoutField } from '@blog/studio/schema-types/objects/layout/layout-field';
import { moduleSubtitle } from '@blog/studio/schema-types/preview/module-subtitle/module-subtitle';
import { toTitleCase } from '@blog/utils/primitives';
import { Rows3 } from 'lucide-react';
import { defineArrayMember, defineField, defineType } from 'sanity';

export const featureHighlightsSchema = defineType({
  name: 'module_featureHighlights',
  title: 'Feature Highlights',
  type: 'document',
  description: 'Two to six rows of image and text that alternate sides.',
  icon: Rows3,
  fields: [
    titleField(),
    brandVariantField(),
    headingBlockField(),
    defineField({
      name: 'highlights',
      title: 'Highlights',
      type: 'array',
      description:
        'The rows in the order they should be read. Images alternate sides from the first row.',
      of: [defineArrayMember({ type: featureHighlightSchema.name })],
      validation: (rule) => [
        rule.required().error('Add at least two rows.'),
        rule.min(2).error('Add at least two rows.'),
        rule.max(6).error('Feature highlights hold at most six rows.'),
      ],
    }),
    ctaButtonsField(),
    defineField({
      name: 'mediaOrder',
      title: 'First Image',
      type: 'string',
      description:
        "Which side the first row's image sits on. Later rows alternate; on phones every image sits above its text.",
      options: {
        layout: 'dropdown',
        list: Object.values(MEDIA_ORDER).map((value) => ({
          title: toTitleCase(value),
          value,
        })),
      },
      initialValue: MEDIA_ORDER.FIRST,
      validation: (rule) => rule.required(),
    }),
    ...alignmentFields([]),
    layoutField,
  ],
  preview: {
    select: {
      title: 'title',
      brandVariant: 'brandVariant',
      highlights: 'highlights',
    },
    prepare({ title, brandVariant, highlights }) {
      const count = Array.isArray(highlights) ? highlights.length : 0;

      return {
        title: title ?? 'Unknown',
        subtitle: moduleSubtitle(
          brandVariant,
          `${String(count)} row${count === 1 ? '' : 's'}`,
        ),
      };
    },
  },
});
