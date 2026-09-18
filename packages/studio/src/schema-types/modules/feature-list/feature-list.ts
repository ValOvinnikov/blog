import {
  CARD_IMAGE_SHAPE,
  CONTENT_ALIGNMENT,
  FULL_BRAND_VARIANT_LIST,
  type TCardImageShape,
} from '@blog/config/constants';
import { featureBlockSchema } from '@blog/studio/schema-types/documents/blocks/feature/feature';
import { alignmentFields } from '@blog/studio/schema-types/fields/alignment-fields/alignment-fields';
import { brandVariantField } from '@blog/studio/schema-types/fields/brand-variant-field/brand-variant-field';
import { ctaButtonsField } from '@blog/studio/schema-types/fields/cta-buttons-field/cta-buttons-field';
import { displayModeField } from '@blog/studio/schema-types/fields/display-mode-field/display-mode-field';
import { showImagesField } from '@blog/studio/schema-types/fields/show-images-field/show-images-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { headingBlockField } from '@blog/studio/schema-types/objects/heading-block/heading-block-field';
import { layoutField } from '@blog/studio/schema-types/objects/layout/layout-field';
import { moduleSubtitle } from '@blog/studio/schema-types/preview/module-subtitle/module-subtitle';
import { getDraftsClient } from '@blog/studio/schema-types/validation/get-drafts-client/get-drafts-client';
import { toTitleCase } from '@blog/utils/primitives';
import { Grid2x2 } from 'lucide-react';
import {
  defineArrayMember,
  defineField,
  defineType,
  type SanityDocument,
  type ValidationContext,
} from 'sanity';

type TFeatureListDocument = {
  showImages?: boolean;
  imageShape?: TCardImageShape;
  features?: { _ref?: string }[];
};

const asFeatureListDocument = (
  document: SanityDocument | undefined,
): TFeatureListDocument | undefined =>
  document as TFeatureListDocument | undefined;

const validateFeatureCardsHaveNeededVisual = async (
  document: SanityDocument | undefined,
  context: ValidationContext,
): Promise<string | true> => {
  const doc = asFeatureListDocument(document);

  if (!doc?.showImages) return true;

  const refs = (doc.features ?? [])
    .map((feature) => feature._ref)
    .filter((ref): ref is string => Boolean(ref));

  if (refs.length === 0) return true;

  const needsIcon = doc.imageShape === CARD_IMAGE_SHAPE.ICON;
  const client = getDraftsClient(context);
  const cards = await client.fetch<{ icon?: string; image?: unknown }[]>(
    `*[_id in $ids]{ icon, image }`,
    { ids: refs },
  );

  const missingNeededVisual = needsIcon
    ? cards.some((card) => !card.icon)
    : cards.some((card) => !card.image);

  if (!missingNeededVisual) return true;

  return needsIcon
    ? 'Some feature cards have no icon, so the grid will look uneven.'
    : 'Some feature cards have no image, so the grid will look uneven.';
};

export const featureListSchema = defineType({
  name: 'module_featureList',
  title: 'Features',
  type: 'document',
  description:
    'A grid of feature cards, each with its own heading, text, and icon or image — used to summarize a set of capabilities or offerings.',
  icon: Grid2x2,
  validation: (rule) =>
    rule.custom(validateFeatureCardsHaveNeededVisual).warning(),
  fields: [
    titleField(),
    brandVariantField({ list: FULL_BRAND_VARIANT_LIST }),
    headingBlockField(),
    defineField({
      name: 'features',
      title: 'Feature Cards',
      type: 'array',
      description: 'The feature cards shown in this section, in display order.',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{ type: featureBlockSchema.name }],
        }),
      ],
      validation: (rule) =>
        rule
          .unique()
          .min(2)
          .error('A features section needs at least two feature cards.')
          .max(8)
          .error('A features section holds at most eight feature cards.'),
    }),
    ctaButtonsField(),
    showImagesField({
      description:
        "Show each card's icon or image, per the shape chosen below.",
    }),
    defineField({
      name: 'imageShape',
      title: 'Image Shape',
      type: 'string',
      description:
        "How each card shows its visual — a wide image, a square image, a circular image, or an icon. Each card's own image and icon fields carry the actual value.",
      options: {
        layout: 'dropdown',
        list: Object.values(CARD_IMAGE_SHAPE).map((value) => ({
          title: toTitleCase(value),
          value,
        })),
      },
      initialValue: CARD_IMAGE_SHAPE.ICON,
      validation: (rule) => rule.required(),
    }),
    displayModeField({
      description:
        'Grid lays the cards out in rows. Carousel puts them in a single row the reader can swipe or step through.',
    }),
    ...alignmentFields([], {
      description:
        'Horizontal alignment of the heading, supporting text and actions. Cards have their own alignment.',
    }),
    defineField({
      name: 'cardAlignment',
      title: 'Card Alignment',
      type: 'string',
      description:
        'Horizontal alignment of the heading and text within each feature card.',
      options: {
        layout: 'dropdown',
        list: [CONTENT_ALIGNMENT.LEFT, CONTENT_ALIGNMENT.CENTER].map(
          (value) => ({ title: toTitleCase(value), value }),
        ),
      },
      initialValue: CONTENT_ALIGNMENT.LEFT,
      validation: (rule) => rule.required(),
    }),
    layoutField,
  ],
  preview: {
    select: {
      title: 'title',
      brandVariant: 'brandVariant',
      imageShape: 'imageShape',
    },
    prepare({ title, brandVariant, imageShape }) {
      return {
        title: title ?? 'Unknown',
        subtitle: moduleSubtitle(
          brandVariant,
          typeof imageShape === 'string' ? toTitleCase(imageShape) : undefined,
        ),
      };
    },
  },
});
