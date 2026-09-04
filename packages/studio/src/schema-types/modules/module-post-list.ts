import { BRAND_VARIANT } from '@blog/config/constants';
import { brandVariantField } from '@blog/studio/schema-types/helpers/brand-variant-field';
import { layoutField } from '@blog/studio/schema-types/helpers/layout-field';
import { sectionHeaderField } from '@blog/studio/schema-types/helpers/section-header-field';
import { titleField } from '@blog/studio/schema-types/helpers/title-field';
import { List } from 'lucide-react';
import { defineField, defineType } from 'sanity';

export const postListSchema = defineType({
  name: 'module_postList',
  title: 'Post List',
  type: 'document',
  icon: List,
  fields: [
    titleField(),
    brandVariantField({
      list: [
        BRAND_VARIANT.BRAND_PRIMARY,
        BRAND_VARIANT.PRIMARY,
        BRAND_VARIANT.SECONDARY,
      ],
    }),
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
