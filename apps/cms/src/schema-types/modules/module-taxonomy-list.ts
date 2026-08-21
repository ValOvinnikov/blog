import { brandVariantField } from '@cms/schema-types/helpers/brand-variant-field';
import { layoutField } from '@cms/schema-types/helpers/layout-field';
import { sectionHeaderField } from '@cms/schema-types/helpers/section-header-field';
import { titleField } from '@cms/schema-types/helpers/title-field';
import { LayoutGrid } from 'lucide-react';
import { defineField, defineType } from 'sanity';

export const taxonomyListSchema = defineType({
  name: 'module_taxonomyList',
  title: 'Taxonomy List',
  type: 'document',
  icon: LayoutGrid,
  fields: [
    titleField(),
    brandVariantField(),
    sectionHeaderField(),
    defineField({
      name: 'emptyMessage',
      title: 'Empty State Message',
      type: 'text',
      description:
        'Optional message shown when the taxonomy list has no items — overrides the page-derived default.',
    }),
    layoutField,
  ],
  preview: {
    select: {
      title: 'title',
    },
    prepare({ title }) {
      return {
        title: title ?? 'Unknown',
      };
    },
  },
});
