import { FULL_BRAND_VARIANT_LIST } from '@blog/config/constants';
import { brandVariantField } from '@blog/studio/schema-types/helpers/brand-variant-field';
import { defineAlignmentFields } from '@blog/studio/schema-types/helpers/define-alignment-fields';
import { headingBlockField } from '@blog/studio/schema-types/helpers/heading-block-field';
import { layoutField } from '@blog/studio/schema-types/helpers/layout-field';
import { showImagesField } from '@blog/studio/schema-types/helpers/show-images-field';
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
    brandVariantField({ list: FULL_BRAND_VARIANT_LIST }),
    headingBlockField({ requireHeading: true }),
    showImagesField(),
    ...defineAlignmentFields([]),
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
