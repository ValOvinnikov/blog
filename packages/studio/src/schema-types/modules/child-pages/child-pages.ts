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
    "A grid of cards linking to the pages directly beneath the page it sits on, in the order editors drag them into. Each card shows the child page's title, with its summary and image taken from that page's Heading Block and SEO.",
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
