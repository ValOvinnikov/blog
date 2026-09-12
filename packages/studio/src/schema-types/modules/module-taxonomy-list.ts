import { TAXONOMY_KIND, TAXONOMY_SORT } from '@blog/config/constants';
import { brandVariantField } from '@blog/studio/schema-types/helpers/brand-variant-field';
import { defineAlignmentFields } from '@blog/studio/schema-types/helpers/define-alignment-fields';
import { headingBlockField } from '@blog/studio/schema-types/helpers/heading-block-field';
import { layoutField } from '@blog/studio/schema-types/helpers/layout-field';
import { titleField } from '@blog/studio/schema-types/helpers/title-field';
import { toTitleCase } from '@blog/utils/primitives';
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
    defineField({
      name: 'taxonomy',
      title: 'Taxonomy',
      type: 'string',
      description:
        'Which terms to list. The Topics and Tags pages list their own, so their module can leave this empty.',
      options: {
        layout: 'dropdown',
        list: Object.values(TAXONOMY_KIND).map((value) => ({
          title: toTitleCase(value),
          value,
        })),
      },
    }),
    defineField({
      name: 'sortOrder',
      title: 'Sort Order',
      type: 'string',
      options: {
        layout: 'dropdown',
        list: Object.values(TAXONOMY_SORT).map((value) => ({
          title: toTitleCase(value),
          value,
        })),
      },
      initialValue: TAXONOMY_SORT.ALPHABETICAL,
    }),
    defineField({
      name: 'limit',
      title: 'Limit',
      type: 'number',
      description: 'Show at most this many terms. Empty shows all of them.',
      validation: (rule) => rule.integer().min(1),
    }),
    defineField({
      name: 'showLatestPosts',
      title: 'Show latest posts',
      type: 'boolean',
      description:
        "Lists each term's two newest posts under its description, as links. A term with no posts shows only its title, description and count.",
      initialValue: true,
    }),
    headingBlockField({ requireHeading: true }),
    ...defineAlignmentFields([]),
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
