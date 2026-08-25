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
      name: 'pageSize',
      title: 'Page Size',
      type: 'number',
      description: 'Posts shown per page of the archive.',
      validation: (rule) => rule.required().integer().min(1).max(24),
    }),
    layoutField,
  ],
  preview: {
    select: {
      title: 'title',
      pageSize: 'pageSize',
    },
    prepare({ title, pageSize }) {
      return {
        title: title ?? 'Unknown',
        subtitle: pageSize ? `Page size: ${String(pageSize)}` : undefined,
      };
    },
  },
});
