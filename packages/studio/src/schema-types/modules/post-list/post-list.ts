import { FULL_BRAND_VARIANT_LIST } from '@blog/config/constants';
import { alignmentFields } from '@blog/studio/schema-types/fields/alignment-fields/alignment-fields';
import { brandVariantField } from '@blog/studio/schema-types/fields/brand-variant-field/brand-variant-field';
import { showImagesField } from '@blog/studio/schema-types/fields/show-images-field/show-images-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { headingBlockField } from '@blog/studio/schema-types/objects/heading-block/heading-block-field';
import { layoutField } from '@blog/studio/schema-types/objects/layout/layout-field';
import { moduleSubtitle } from '@blog/studio/schema-types/preview/module-subtitle/module-subtitle';
import { List } from 'lucide-react';
import { defineField, defineType } from 'sanity';

export const postListSchema = defineType({
  name: 'module_postList',
  title: 'Post List',
  type: 'document',
  description:
    "The paginated archive of posts for the page it sits on — all of them, or only the ones in that page's topic or tag.",
  icon: List,
  fields: [
    titleField(),
    brandVariantField({ list: FULL_BRAND_VARIANT_LIST }),
    headingBlockField(),
    defineField({
      name: 'pageSize',
      title: 'Page Size',
      type: 'number',
      description: 'Posts shown per page of the archive.',
      validation: (rule) => rule.required().integer().min(1).max(24),
    }),
    showImagesField(),
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
      pageSize: 'pageSize',
    },
    prepare({ title, brandVariant, pageSize }) {
      return {
        title: title ?? 'Unknown',
        subtitle: moduleSubtitle(
          brandVariant,
          pageSize ? `Page size: ${String(pageSize)}` : undefined,
        ),
      };
    },
  },
});
