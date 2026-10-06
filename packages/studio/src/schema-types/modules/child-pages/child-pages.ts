import { alignmentFields } from '@blog/studio/schema-types/fields/alignment-fields/alignment-fields';
import { brandVariantField } from '@blog/studio/schema-types/fields/brand-variant-field/brand-variant-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { moduleHeadingBlockField } from '@blog/studio/schema-types/objects/module-heading-block/module-heading-block-field';
import { wideLayoutField } from '@blog/studio/schema-types/objects/wide-layout/wide-layout-field';
import { moduleSubtitle } from '@blog/studio/schema-types/preview/module-subtitle/module-subtitle';
import { FolderTree } from 'lucide-react';
import { defineType } from 'sanity';

export const childPagesSchema = defineType({
  name: 'module_childPages',
  title: 'Child Pages',
  type: 'document',
  description:
    'Shows a card for each page under the page using this template. Renders nothing on pages without children.',
  icon: FolderTree,
  fields: [
    titleField(),
    brandVariantField(),
    moduleHeadingBlockField({ isRequired: false }),
    ...alignmentFields([], {
      title: 'Heading Alignment',
      description: 'Horizontal alignment of the heading and supporting text.',
    }),
    wideLayoutField,
  ],
  preview: {
    select: {
      title: 'title',
      brandVariant: 'brandVariant',
    },
    prepare({ title, brandVariant }) {
      return {
        title: title ?? 'Unknown',
        subtitle: moduleSubtitle(brandVariant),
      };
    },
  },
});
