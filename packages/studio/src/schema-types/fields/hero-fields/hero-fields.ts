import {
  CONTENT_ALIGNMENT,
  FULL_BRAND_VARIANT_LIST,
  HERO_VARIANT,
  MEDIA_ORDER,
  type THeroVariant,
} from '@blog/config/constants';
import { alignmentFields } from '@blog/studio/schema-types/fields/alignment-fields/alignment-fields';
import { brandVariantField } from '@blog/studio/schema-types/fields/brand-variant-field/brand-variant-field';
import { actionGroupField } from '@blog/studio/schema-types/objects/action-group/action-group-field';
import { heroLayoutField } from '@blog/studio/schema-types/objects/hero-layout/hero-layout-field';
import { imageWithAltSchema } from '@blog/studio/schema-types/objects/image-with-alt/image-with-alt';
import { toTitleCase } from '@blog/utils/primitives';
import { defineField } from 'sanity';

type THeroFieldsParent = { variant?: string };

const isVariant = (parent: unknown, variant: THeroVariant): boolean =>
  (parent as THeroFieldsParent | undefined)?.variant === variant;

const isNotVariant =
  (variant: THeroVariant) =>
  ({ parent }: { parent?: unknown }): boolean =>
    !isVariant(parent, variant);

type THeroFieldsOptions = {
  /** Restricts the Variant field's option set, for a kind that can't sensibly be a Banner. */
  variants?: readonly THeroVariant[];
  /** Pass `false` when the kind supplies its own image field in this position. */
  image?: false;
};

/**
 * The field tail shared by every hero kind, appended after that kind's own
 * content fields: variant, brand variant, image, content position/alignment,
 * media order and layout.
 */
export const heroFields = (options: THeroFieldsOptions = {}) => {
  const variantList = options.variants ?? Object.values(HERO_VARIANT);

  const imageFields =
    options.image === false
      ? []
      : [
          defineField({
            name: 'image',
            title: 'Image',
            type: imageWithAltSchema.name,
            description:
              "The hero's image — sits beside the copy for Split, below the copy for Stacked, or behind the copy as a full-bleed background for Banner.",
            validation: (rule) =>
              rule.custom((value, context) => {
                const variant = (
                  context.parent as THeroFieldsParent | undefined
                )?.variant;

                if (
                  !value &&
                  (variant === HERO_VARIANT.SPLIT ||
                    variant === HERO_VARIANT.BANNER)
                ) {
                  return 'Image is required for the Split and Banner variants.';
                }

                return true;
              }),
          }),
        ];

  return [
    defineField({
      name: 'variant',
      title: 'Variant',
      type: 'string',
      description:
        'Which shape the hero takes: Split shows the image beside the heading and copy, Stacked shows it below the copy, and Banner uses it as a full-bleed background behind the copy.',
      options: {
        layout: 'radio',
        list: variantList.map((value) => ({
          title: toTitleCase(value),
          value,
        })),
      },
      initialValue: variantList.includes(HERO_VARIANT.SPLIT)
        ? HERO_VARIANT.SPLIT
        : variantList[0],
      validation: (rule) => rule.required(),
    }),
    brandVariantField({ list: FULL_BRAND_VARIANT_LIST }),
    ...imageFields,
    ...alignmentFields([
      {
        name: 'contentPositionSplit',
        title: 'Content Position',
        description:
          'Where the content sits relative to the image, on the Split grid.',
        allow: [CONTENT_ALIGNMENT.LEFT, CONTENT_ALIGNMENT.RIGHT],
        initialValue: CONTENT_ALIGNMENT.LEFT,
        hidden: isNotVariant(HERO_VARIANT.SPLIT),
      },
      {
        name: 'contentPositionBanner',
        title: 'Content Position',
        description:
          'Where the content sits relative to the image, over the full-bleed background.',
        allow: [
          CONTENT_ALIGNMENT.LEFT,
          CONTENT_ALIGNMENT.CENTER,
          CONTENT_ALIGNMENT.RIGHT,
        ],
        initialValue: CONTENT_ALIGNMENT.LEFT,
        hidden: isNotVariant(HERO_VARIANT.BANNER),
      },
    ]),
    defineField({
      name: 'mediaOrderSplit',
      title: 'Mobile Media Order',
      type: 'string',
      description: 'Order of media once the two columns collapse on mobile.',
      options: {
        layout: 'dropdown',
        list: Object.values(MEDIA_ORDER).map((value) => ({
          title: toTitleCase(value),
          value,
        })),
      },
      initialValue: MEDIA_ORDER.LAST,
      hidden: isNotVariant(HERO_VARIANT.SPLIT),
    }),
    defineField({
      name: 'mediaOrderStacked',
      title: 'Media Order',
      type: 'string',
      description: 'Order of media and content at every width.',
      options: {
        layout: 'dropdown',
        list: Object.values(MEDIA_ORDER).map((value) => ({
          title: toTitleCase(value),
          value,
        })),
      },
      initialValue: MEDIA_ORDER.LAST,
      hidden: isNotVariant(HERO_VARIANT.STACKED),
    }),
    actionGroupField(),
    heroLayoutField,
  ];
};
