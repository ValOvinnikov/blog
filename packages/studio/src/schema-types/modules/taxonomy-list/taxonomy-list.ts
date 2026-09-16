import { TAXONOMY_KIND, TAXONOMY_SORT } from '@blog/config/constants';
import { alignmentFields } from '@blog/studio/schema-types/fields/alignment-fields/alignment-fields';
import { brandVariantField } from '@blog/studio/schema-types/fields/brand-variant-field/brand-variant-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { headingBlockField } from '@blog/studio/schema-types/objects/heading-block/heading-block-field';
import { layoutField } from '@blog/studio/schema-types/objects/layout/layout-field';
import { moduleSubtitle } from '@blog/studio/schema-types/preview/module-subtitle/module-subtitle';
import { toTitleCase } from '@blog/utils/primitives';
import { LayoutGrid } from 'lucide-react';
import { defineField, defineType } from 'sanity';

const TERMS_FIELDSET = 'terms';

export const taxonomyListSchema = defineType({
  name: 'module_taxonomyList',
  title: 'Taxonomy List',
  type: 'document',
  description:
    'A browsable list of topics or tags, each with its description and post count, so readers can explore the site by subject.',
  icon: LayoutGrid,
  fieldsets: [
    {
      name: TERMS_FIELDSET,
      title: 'Terms',
      description: 'Which terms to list, in what order, and how many.',
    },
  ],
  fields: [
    titleField(),
    brandVariantField(),
    headingBlockField(),
    defineField({
      name: 'taxonomy',
      title: 'Taxonomy',
      type: 'string',
      fieldset: TERMS_FIELDSET,
      description:
        'Topics or tags. Leave empty to list whatever the page itself is about.',
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
      fieldset: TERMS_FIELDSET,
      description: 'How the terms are ordered.',
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
      fieldset: TERMS_FIELDSET,
      description: 'Show at most this many terms. Empty shows all of them.',
      validation: (rule) => rule.integer().min(1),
    }),
    defineField({
      name: 'showLatestPosts',
      title: 'Show Latest Posts',
      type: 'boolean',
      description: "Adds links to each term's two newest posts beneath it.",
      initialValue: true,
    }),
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
      taxonomy: 'taxonomy',
    },
    prepare({ title, brandVariant, taxonomy }) {
      return {
        title: title ?? 'Unknown',
        subtitle: moduleSubtitle(
          brandVariant,
          typeof taxonomy === 'string' ? toTitleCase(taxonomy) : undefined,
        ),
      };
    },
  },
});
