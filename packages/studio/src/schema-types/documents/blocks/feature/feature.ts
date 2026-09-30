import { FEATURE_ICONS } from '@blog/config/constants';
import { linkSchema } from '@blog/studio/schema-types/documents/link/link';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { headingBlockField } from '@blog/studio/schema-types/objects/heading-block/heading-block-field';
import { imageWithAltSchema } from '@blog/studio/schema-types/objects/image-with-alt/image-with-alt';
import { toTitleCase } from '@blog/utils/primitives';
import { IdCard } from 'lucide-react';
import {
  defineField,
  defineType,
  type SanityDocument,
  type ValidationContext,
} from 'sanity';

type TFeatureBlockDocument = {
  icon?: string;
  image?: unknown;
};

const asFeatureBlockDocument = (
  document: SanityDocument | undefined,
): TFeatureBlockDocument | undefined =>
  document as TFeatureBlockDocument | undefined;

const FEATURE_VISUAL_ERROR =
  'Add an icon or an image so this card has something to display.';

const validateFeatureHasVisual = (
  _value: unknown,
  context: ValidationContext,
): string | true => {
  const doc = asFeatureBlockDocument(context.document);

  return doc?.icon || doc?.image ? true : FEATURE_VISUAL_ERROR;
};

export const featureBlockSchema = defineType({
  name: 'block_feature',
  title: 'Feature Card',
  type: 'document',
  description:
    'One feature — a heading and supporting text from its heading block, plus an icon or image — reusable across every Features module on the site.',
  icon: IdCard,
  fields: [
    titleField(),
    headingBlockField(),
    defineField({
      name: 'icon',
      title: 'Icon',
      type: 'string',
      description: 'The icon shown for this card when it has no image.',
      options: {
        layout: 'dropdown',
        list: FEATURE_ICONS.map((value) => ({
          title: toTitleCase(value),
          value,
        })),
      },
      validation: (rule) => rule.custom(validateFeatureHasVisual),
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: imageWithAltSchema.name,
      description:
        "The image shown for this card, cropped to the shape chosen on the Features module. Takes priority over the card's icon when both are set.",
      validation: (rule) => rule.custom(validateFeatureHasVisual),
    }),
    defineField({
      name: 'link',
      title: 'Link',
      type: 'reference',
      description: 'Where this card links to, if anywhere.',
      to: [{ type: linkSchema.name }],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      linkLabel: 'link.label',
      media: 'image',
    },
    prepare({ title, linkLabel, media }) {
      return {
        title: String(title ?? 'Unknown'),
        subtitle: typeof linkLabel === 'string' ? linkLabel : 'No link',
        media: media ?? undefined,
      };
    },
  },
});
