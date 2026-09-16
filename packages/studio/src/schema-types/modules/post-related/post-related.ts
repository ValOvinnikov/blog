import { alignmentFields } from '@blog/studio/schema-types/fields/alignment-fields/alignment-fields';
import { brandVariantField } from '@blog/studio/schema-types/fields/brand-variant-field/brand-variant-field';
import { showImagesField } from '@blog/studio/schema-types/fields/show-images-field/show-images-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { headingBlockField } from '@blog/studio/schema-types/objects/heading-block/heading-block-field';
import { layoutField } from '@blog/studio/schema-types/objects/layout/layout-field';
import { moduleSubtitle } from '@blog/studio/schema-types/preview/module-subtitle/module-subtitle';
import { BookOpen } from 'lucide-react';
import { defineField, defineType } from 'sanity';

export const postRelatedSchema = defineType({
  name: 'module_postRelated',
  title: 'Related Reading',
  type: 'document',
  description:
    'Other posts the reader might want next, chosen automatically from the tags and topic of the post being read. Only available on post pages.',
  icon: BookOpen,
  fields: [
    titleField(),
    brandVariantField(),
    headingBlockField(),
    defineField({
      name: 'limit',
      title: 'Limit',
      type: 'number',
      description: 'Maximum number of related posts to show.',
      initialValue: 3,
      validation: (rule) => rule.required().integer().min(1).max(6),
    }),
    showImagesField(),
    ...alignmentFields([], {
      title: 'Heading Alignment',
      description: 'Horizontal alignment of the heading and supporting text.',
    }),
    layoutField,
  ],
  preview: {
    select: {
      title: 'title',
      brandVariant: 'brandVariant',
      limit: 'limit',
    },
    prepare({ title, brandVariant, limit }) {
      return {
        title: title ?? 'Unknown',
        subtitle: moduleSubtitle(
          brandVariant,
          limit ? `Limit: ${String(limit)}` : undefined,
        ),
      };
    },
  },
});
