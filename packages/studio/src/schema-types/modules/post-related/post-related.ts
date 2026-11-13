import { alignmentFields } from '@blog/studio/schema-types/fields/alignment-fields/alignment-fields';
import {
  appearanceFieldGroups,
  appearanceFields,
  appearanceFieldsets,
} from '@blog/studio/schema-types/fields/appearance-fields/appearance-fields';
import { brandVariantField } from '@blog/studio/schema-types/fields/brand-variant-field/brand-variant-field';
import {
  displayModeField,
  isCarouselMode,
} from '@blog/studio/schema-types/fields/display-mode-field/display-mode-field';
import { showImagesField } from '@blog/studio/schema-types/fields/show-images-field/show-images-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { moduleHeadingBlockField } from '@blog/studio/schema-types/objects/module-heading-block/module-heading-block-field';
import { wideLayoutField } from '@blog/studio/schema-types/objects/wide-layout/wide-layout-field';
import { limitPreview } from '@blog/studio/schema-types/preview/limit-preview/limit-preview';
import { BookOpen } from 'lucide-react';
import { defineField, defineType } from 'sanity';

export const postRelatedSchema = defineType({
  name: 'module_postRelated',
  title: 'Related Reading',
  type: 'document',
  description:
    'Other posts the reader might want next, chosen automatically from the tags and topic of the post being read. Only available on post pages.',
  icon: BookOpen,
  fieldsets: appearanceFieldsets,
  groups: appearanceFieldGroups,
  fields: appearanceFields({
    content: [
      titleField(),
      moduleHeadingBlockField(),
      defineField({
        name: 'limit',
        title: 'Limit',
        type: 'number',
        description: 'Maximum number of related posts to show.',
        initialValue: 3,
        validation: (rule) => rule.required().integer().min(1).max(6),
      }),
      showImagesField({ subject: 'post' }),
    ],
    appearance: [
      brandVariantField(),
      displayModeField(),
      ...alignmentFields([], { title: 'Heading Alignment' }),
    ],
    layout: wideLayoutField,
    columnsHidden: isCarouselMode,
  }),
  preview: limitPreview,
});
