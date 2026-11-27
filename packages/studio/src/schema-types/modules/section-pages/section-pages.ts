import { cardModuleAppearance } from '@shinefold/studio/schema-types/fields/appearance-fields/appearance-fields';
import { titleField } from '@shinefold/studio/schema-types/fields/title-field/title-field';
import { moduleHeadingBlockField } from '@shinefold/studio/schema-types/objects/module-heading-block/module-heading-block-field';
import { moduleSubtitle } from '@shinefold/studio/schema-types/preview/module-subtitle/module-subtitle';
import { FolderTree } from 'lucide-react';
import { defineType } from 'sanity';

export const sectionPagesSchema = defineType({
  name: 'module_sectionPages',
  title: 'Section Pages',
  type: 'document',
  description:
    'Shows a card for each page in this section. Renders nothing on pages without pages under them.',
  icon: FolderTree,
  ...cardModuleAppearance({
    content: [titleField(), moduleHeadingBlockField({ isRequired: false })],
  }),
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
