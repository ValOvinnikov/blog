import { alignmentFields } from '@blog/studio/schema-types/fields/alignment-fields/alignment-fields';
import { brandVariantField } from '@blog/studio/schema-types/fields/brand-variant-field/brand-variant-field';
import { ctaButtonsField } from '@blog/studio/schema-types/fields/cta-buttons-field/cta-buttons-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { embedObjectSchema } from '@blog/studio/schema-types/objects/embed/embed';
import { layoutField } from '@blog/studio/schema-types/objects/layout/layout-field';
import { moduleHeadingBlockField } from '@blog/studio/schema-types/objects/module-heading-block/module-heading-block-field';
import { moduleSubtitle } from '@blog/studio/schema-types/preview/module-subtitle/module-subtitle';
import { defaultLanguageValue } from '@blog/studio/schema-types/validation/default-language-value/default-language-value';
import { SquarePlay } from 'lucide-react';
import { defineField, defineType } from 'sanity';

export const embedSchema = defineType({
  name: 'module_embed',
  title: 'Embed',
  type: 'document',
  description:
    'A video, booking calendar or map from another site, placed as a section of the page.',
  icon: SquarePlay,
  fields: [
    titleField(),
    brandVariantField(),
    moduleHeadingBlockField(),
    defineField({
      name: 'embed',
      title: 'Embed',
      type: embedObjectSchema.name,
      description: 'The link to show and how to name it.',
      validation: (rule) => rule.required(),
    }),
    ctaButtonsField(),
    ...alignmentFields([], { hasActions: true, alignsItems: true }),
    layoutField,
  ],
  preview: {
    select: {
      title: 'title',
      brandVariant: 'brandVariant',
      embedTitle: 'embed.title',
    },
    prepare({
      title,
      brandVariant,
      embedTitle,
    }: {
      title?: string;
      brandVariant?: string;
      embedTitle?: unknown;
    }) {
      return {
        title: title ?? 'Unknown',
        subtitle: moduleSubtitle(
          brandVariant,
          defaultLanguageValue(embedTitle),
        ),
      };
    },
  },
});
