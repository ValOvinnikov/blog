import { brandVariantField } from '@cms/schema-types/helpers/brand-variant-field';
import { layoutField } from '@cms/schema-types/helpers/layout-field';
import { sectionHeaderField } from '@cms/schema-types/helpers/section-header-field';
import { titleField } from '@cms/schema-types/helpers/title-field';
import { LayoutGrid } from 'lucide-react';
import { defineType } from 'sanity';

export const taxonomyListSchema = defineType({
  name: 'module_taxonomyList',
  title: 'Taxonomy List',
  type: 'document',
  icon: LayoutGrid,
  fields: [
    titleField(),
    brandVariantField(),
    sectionHeaderField(),
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
