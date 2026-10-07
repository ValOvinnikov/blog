import { MEDIA_ORDER } from '@blog/config/constants';
import { alignmentFields } from '@blog/studio/schema-types/fields/alignment-fields/alignment-fields';
import { brandVariantField } from '@blog/studio/schema-types/fields/brand-variant-field/brand-variant-field';
import { ctaButtonsField } from '@blog/studio/schema-types/fields/cta-buttons-field/cta-buttons-field';
import { mediaOrderField } from '@blog/studio/schema-types/fields/media-order-field/media-order-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { featureHighlightSchema } from '@blog/studio/schema-types/objects/feature-highlight/feature-highlight';
import { moduleHeadingBlockField } from '@blog/studio/schema-types/objects/module-heading-block/module-heading-block-field';
import { wideLayoutField } from '@blog/studio/schema-types/objects/wide-layout/wide-layout-field';
import { moduleSubtitle } from '@blog/studio/schema-types/preview/module-subtitle/module-subtitle';
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
    moduleHeadingBlockField(),
    defineField({
      name: 'highlights',
      title: 'Highlights',
      type: 'array',
      description:
        'The rows in the order they should be read. Images alternate sides from the first row; on phones every image sits above its text.',
      of: [defineArrayMember({ type: featureHighlightSchema.name })],
      validation: (rule) => [
        rule.required().error('Add at least two rows.'),
        rule.min(2).error('Add at least two rows.'),
        rule.max(6).error('Feature highlights hold at most six rows.'),
      ],
    }),
    ctaButtonsField(),
    mediaOrderField({
      kind: 'STACKED',
      name: 'mediaOrder',
      initialValue: MEDIA_ORDER.FIRST,
      isRequired: true,
    }),
    ...alignmentFields([], { hasActions: true }),
    wideLayoutField,
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
