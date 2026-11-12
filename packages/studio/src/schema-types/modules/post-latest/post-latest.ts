import { DISPLAY_MODE } from '@blog/config/constants';
import type { TMaybeUndefined } from '@blog/config/types';
import { alignmentFields } from '@blog/studio/schema-types/fields/alignment-fields/alignment-fields';
import {
  appearanceFieldGroups,
  appearanceFields,
} from '@blog/studio/schema-types/fields/appearance-fields/appearance-fields';
import { brandVariantField } from '@blog/studio/schema-types/fields/brand-variant-field/brand-variant-field';
import { displayModeField } from '@blog/studio/schema-types/fields/display-mode-field/display-mode-field';
import { showImagesField } from '@blog/studio/schema-types/fields/show-images-field/show-images-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { moduleHeadingBlockField } from '@blog/studio/schema-types/objects/module-heading-block/module-heading-block-field';
import { wideLayoutField } from '@blog/studio/schema-types/objects/wide-layout/wide-layout-field';
import { moduleSubtitle } from '@blog/studio/schema-types/preview/module-subtitle/module-subtitle';
import { Clock } from 'lucide-react';
import {
  type ConditionalPropertyCallback,
  defineField,
  defineType,
  type ValidationContext,
} from 'sanity';

type TPostLatestDocument = {
  limit?: number;
  displayMode?: string;
};

const isCarousel: ConditionalPropertyCallback = ({ parent }) =>
  (parent as TMaybeUndefined<TPostLatestDocument>)?.displayMode ===
  DISPLAY_MODE.CAROUSEL;

const validateCarouselHasEnoughPosts = (
  value: TMaybeUndefined<string>,
  context: ValidationContext,
): string | true => {
  if (value !== DISPLAY_MODE.CAROUSEL) return true;

  const parent = context.parent as TMaybeUndefined<TPostLatestDocument>;

  return (parent?.limit ?? 0) < 4
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
  groups: appearanceFieldGroups,
  fields: appearanceFields({
    content: [
      titleField(),
      moduleHeadingBlockField(),
      defineField({
        name: 'limit',
        title: 'Limit',
        type: 'number',
        description: 'Maximum number of posts to show.',
        validation: (rule) => rule.required().integer().min(1).max(12),
      }),
      showImagesField({ subject: 'post' }),
    ],
    appearance: [
      brandVariantField(),
      displayModeField({
        validation: (rule) =>
          rule.custom(validateCarouselHasEnoughPosts).warning(),
      }),
      ...alignmentFields([], { title: 'Heading Alignment' }),
      wideLayoutField,
    ],
    columnsHidden: isCarousel,
  }),
  preview: {
    select: {
      title: 'title',
      brandVariant: 'brandVariant',
      limit: 'limit',
    },
    prepare({ title, brandVariant, limit }) {
      return {
        title: title ?? 'Unknown',
        subtitle: moduleSubtitle(
          brandVariant,
          limit ? `Limit: ${String(limit)}` : undefined,
        ),
      };
    },
  },
});
