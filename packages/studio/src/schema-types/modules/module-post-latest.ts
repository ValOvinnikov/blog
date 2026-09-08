import { DISPLAY_MODE, type TDisplayMode } from '@blog/config';
import { brandVariantField } from '@blog/studio/schema-types/helpers/brand-variant-field';
import { defineAlignmentFields } from '@blog/studio/schema-types/helpers/define-alignment-fields';
import { displayModeField } from '@blog/studio/schema-types/helpers/display-mode-field';
import { headingBlockField } from '@blog/studio/schema-types/helpers/heading-block-field';
import { layoutField } from '@blog/studio/schema-types/helpers/layout-field';
import { showImagesField } from '@blog/studio/schema-types/helpers/show-images-field';
import { titleField } from '@blog/studio/schema-types/helpers/title-field';
import { Clock } from 'lucide-react';
import { defineField, defineType, type SanityDocument } from 'sanity';

type TPostLatestDocument = {
  displayMode?: TDisplayMode;
  limit?: number;
};

const validateCarouselHasEnoughPosts = (
  document: SanityDocument | undefined,
): string | true => {
  const doc = document as TPostLatestDocument | undefined;

  if (doc?.displayMode !== DISPLAY_MODE.CAROUSEL) return true;

  return (doc?.limit ?? 0) < 4
    ? 'Fewer than four posts fit on one row on wide screens, so this carousel has nothing to scroll there. Raise the limit, or use the grid.'
    : true;
};

export const postLatestSchema = defineType({
  name: 'module_postLatest',
  title: 'Latest Posts',
  type: 'document',
  icon: Clock,
  validation: (rule) => rule.custom(validateCarouselHasEnoughPosts).warning(),
  fields: [
    titleField(),
    brandVariantField(),
    headingBlockField(),
    showImagesField(),
    displayModeField(),
    ...defineAlignmentFields([]),
    defineField({
      name: 'limit',
      title: 'Limit',
      type: 'number',
      description: 'Maximum number of posts to show.',
      validation: (rule) => rule.required().integer().min(1).max(12),
    }),
    layoutField,
  ],
  preview: {
    select: {
      title: 'title',
      limit: 'limit',
    },
    prepare({ title, limit }) {
      return {
        title: title ?? 'Unknown',
        subtitle: limit ? `Limit: ${String(limit)}` : undefined,
      };
    },
  },
});
