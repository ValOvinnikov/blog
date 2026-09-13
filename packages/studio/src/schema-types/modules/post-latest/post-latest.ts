import { DISPLAY_MODE, type TDisplayMode } from '@blog/config/constants';
import { alignmentFields } from '@blog/studio/schema-types/fields/alignment-fields/alignment-fields';
import { brandVariantField } from '@blog/studio/schema-types/fields/brand-variant-field/brand-variant-field';
import { displayModeField } from '@blog/studio/schema-types/fields/display-mode-field/display-mode-field';
import { showImagesField } from '@blog/studio/schema-types/fields/show-images-field/show-images-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { headingBlockField } from '@blog/studio/schema-types/objects/heading-block/heading-block-field';
import { layoutField } from '@blog/studio/schema-types/objects/layout/layout-field';
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
  description:
    'A short list or carousel of the newest posts, used to surface recent content on any page.',
  icon: Clock,
  validation: (rule) => rule.custom(validateCarouselHasEnoughPosts).warning(),
  fields: [
    titleField(),
    brandVariantField(),
    headingBlockField({ requireHeading: true }),
    showImagesField(),
    displayModeField(),
    ...alignmentFields([]),
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
