import { brandVariantField } from '@cms/schema-types/helpers/brand-variant-field';
import { layoutField } from '@cms/schema-types/helpers/layout-field';
import { sectionHeaderField } from '@cms/schema-types/helpers/section-header-field';
import { titleField } from '@cms/schema-types/helpers/title-field';
import { List } from 'lucide-react';
import { defineField, defineType } from 'sanity';

export const postListSchema = defineType({
  name: 'module_postList',
  title: 'Post List',
  type: 'document',
  icon: List,
  fields: [
    titleField(),
    brandVariantField(),
    sectionHeaderField(),
    defineField({
      name: 'limit',
      title: 'Limit',
      type: 'number',
      description: 'Maximum number of posts to show.',
      validation: (rule) => rule.required().integer().min(1).max(24),
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
