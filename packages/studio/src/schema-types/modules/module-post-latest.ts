import { brandVariantField } from '@blog/studio/schema-types/helpers/brand-variant-field';
import { defineAlignmentFields } from '@blog/studio/schema-types/helpers/define-alignment-fields';
import { layoutField } from '@blog/studio/schema-types/helpers/layout-field';
import { sectionHeaderField } from '@blog/studio/schema-types/helpers/section-header-field';
import { titleField } from '@blog/studio/schema-types/helpers/title-field';
import { List } from 'lucide-react';
import { defineField, defineType } from 'sanity';

export const postLatestSchema = defineType({
  name: 'module_postLatest',
  title: 'Post Latest',
  type: 'document',
  icon: List,
  fields: [
    titleField(),
    brandVariantField(),
    sectionHeaderField(),
    ...defineAlignmentFields([]),
    defineField({
      name: 'limit',
      title: 'Limit',
      type: 'number',
      description: 'Maximum number of posts to show.',
      validation: (rule) => rule.required().integer().min(1).max(12),
    }),
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
