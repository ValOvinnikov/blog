import { brandVariantField } from '@blog/studio/schema-types/helpers/brand-variant-field';
import { defineAlignmentFields } from '@blog/studio/schema-types/helpers/define-alignment-fields';
import { headingBlockField } from '@blog/studio/schema-types/helpers/heading-block-field';
import { layoutField } from '@blog/studio/schema-types/helpers/layout-field';
import { showImagesField } from '@blog/studio/schema-types/helpers/show-images-field';
import { titleField } from '@blog/studio/schema-types/helpers/title-field';
import { BookOpen } from 'lucide-react';
import { defineField, defineType } from 'sanity';

export const postRelatedSchema = defineType({
  name: 'module_postRelated',
  title: 'Related Reading',
  type: 'document',
  icon: BookOpen,
  fields: [
    titleField(),
    brandVariantField(),
    headingBlockField({ requireHeading: true }),
    showImagesField(),
    defineField({
      name: 'limit',
      title: 'Limit',
      type: 'number',
      description: 'Maximum number of related posts to show.',
      initialValue: 3,
      validation: (rule) => rule.required().integer().min(1).max(6),
    }),
    ...defineAlignmentFields([]),
    layoutField,
  ],
  preview: {
    select: {
      title: 'title',
      limit: 'limit',
    },
    prepare({ title, limit }) {
      return {
        title: title ?? 'Unknown',
        subtitle: limit ? `Limit: ${String(limit)}` : undefined,
      };
    },
  },
});
