import { TAXONOMY_KIND, TAXONOMY_SORT } from '@blog/config/constants';
import { alignmentFields } from '@blog/studio/schema-types/fields/alignment-fields/alignment-fields';
import { brandVariantField } from '@blog/studio/schema-types/fields/brand-variant-field/brand-variant-field';
import { showToggleField } from '@blog/studio/schema-types/fields/show-toggle-field/show-toggle-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { moduleHeadingBlockField } from '@blog/studio/schema-types/objects/module-heading-block/module-heading-block-field';
import { wideLayoutField } from '@blog/studio/schema-types/objects/wide-layout/wide-layout-field';
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
    moduleHeadingBlockField(),
    defineField({
      name: 'taxonomy',
      title: 'Taxonomy',
      type: 'string',
      fieldset: TERMS_FIELDSET,
      description:
        'Topics or tags. Leave empty and the module shows its empty state.',
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
    showToggleField({
      name: 'showLatestPosts',
      title: 'Show Latest Posts',
      description: "Adds links to each term's two newest posts beneath it.",
      initialValue: true,
    }),
    ...alignmentFields([]),
    wideLayoutField,
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
