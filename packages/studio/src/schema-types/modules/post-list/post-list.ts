import { cardModuleAppearance } from '@shinefold/studio/schema-types/fields/appearance-fields/appearance-fields';
import { showImagesField } from '@shinefold/studio/schema-types/fields/show-images-field/show-images-field';
import { titleField } from '@shinefold/studio/schema-types/fields/title-field/title-field';
import { moduleHeadingBlockField } from '@shinefold/studio/schema-types/objects/module-heading-block/module-heading-block-field';
import { moduleSubtitle } from '@shinefold/studio/schema-types/preview/module-subtitle/module-subtitle';
import { List } from 'lucide-react';
import { defineField, defineType } from 'sanity';

export const postListSchema = defineType({
  name: 'module_postList',
  title: 'Post List',
  type: 'document',
  description:
    "The paginated archive of posts for the page it sits on — all of them, or only the ones in that page's topic or tag.",
  icon: List,
  ...cardModuleAppearance({
    content: [
      titleField(),
      moduleHeadingBlockField(),
      defineField({
        name: 'pageSize',
        title: 'Page Size',
        type: 'number',
        description: 'Posts shown per page of the archive.',
        validation: (rule) => rule.required().integer().min(1).max(24),
      }),
      showImagesField({ subject: 'post' }),
    ],
  }),
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
