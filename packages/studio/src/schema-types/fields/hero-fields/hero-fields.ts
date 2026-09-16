import {
  CONTENT_ALIGNMENT,
  HERO_VARIANT,
  MEDIA_ORDER,
  type THeroVariant,
} from '@blog/config/constants';
import { alignmentFields } from '@blog/studio/schema-types/fields/alignment-fields/alignment-fields';
import { heroLayoutField } from '@blog/studio/schema-types/objects/hero-layout/hero-layout-field';
import { imageWithAltSchema } from '@blog/studio/schema-types/objects/image-with-alt/image-with-alt';
import { toTitleCase } from '@blog/utils/primitives';
import { defineField, type FieldsetDefinition } from 'sanity';

type THeroFieldsParent = { variant?: string };

const isVariant = (parent: unknown, variant: THeroVariant): boolean =>
  (parent as THeroFieldsParent | undefined)?.variant === variant;

const isNotVariant =
  (variant: THeroVariant) =>
  ({ parent }: { parent?: unknown }): boolean =>
    !isVariant(parent, variant);

export const HERO_FIELDSET_CONTENT_POSITION = 'contentPosition';

/** The fieldset every hero kind declares to group its position/alignment fields. */
export const heroFieldsets: FieldsetDefinition[] = [
  {
    name: HERO_FIELDSET_CONTENT_POSITION,
    title: 'Content Position',
    description: 'Where the text sits in the hero and how it is aligned.',
  },
];

type THeroFieldsOptions = {
  /** Restricts the Variant field's option set, for a kind that can't sensibly be a Banner. */
  variants?: readonly THeroVariant[];
  hasOwnImage?: boolean;
  hasStackedLayout?: boolean;
};

/**
 * The field tail shared by every hero kind, appended after that kind's own
 * content fields: variant, image, content position/alignment and media order.
 */
export const heroFields = (options: THeroFieldsOptions = {}) => {
  const variantList = options.variants ?? Object.values(HERO_VARIANT);

  const imageFields = options.hasOwnImage
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
              const variant = (context.parent as THeroFieldsParent | undefined)
                ?.variant;

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

  const mediaOrderStackedFields =
    options.hasStackedLayout === false
      ? []
      : [
          defineField({
            name: 'mediaOrderStacked',
            title: 'Media Order',
            type: 'string',
            description: 'Whether the image comes before or after the text.',
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
        ];

  return [
    defineField({
      name: 'variant',
      title: 'Variant',
      type: 'string',
      description:
        'Split puts the image beside the copy, Stacked puts it below, Banner uses it as a full-bleed background.',
      options: {
        layout: 'dropdown',
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
    ...imageFields,
    ...alignmentFields(
      [
        {
          name: 'contentPositionSplit',
          title: 'Position',
          description: 'Which side of the image the text sits on.',
          allow: [CONTENT_ALIGNMENT.LEFT, CONTENT_ALIGNMENT.RIGHT],
          initialValue: CONTENT_ALIGNMENT.LEFT,
          hidden: isNotVariant(HERO_VARIANT.SPLIT),
          fieldset: HERO_FIELDSET_CONTENT_POSITION,
        },
        {
          name: 'contentPositionBanner',
          title: 'Position',
          description: 'Where the text sits over the background image.',
          allow: [
            CONTENT_ALIGNMENT.LEFT,
            CONTENT_ALIGNMENT.CENTER,
            CONTENT_ALIGNMENT.RIGHT,
          ],
          initialValue: CONTENT_ALIGNMENT.LEFT,
          hidden: isNotVariant(HERO_VARIANT.BANNER),
          fieldset: HERO_FIELDSET_CONTENT_POSITION,
        },
      ],
      { fieldset: HERO_FIELDSET_CONTENT_POSITION },
    ),
    defineField({
      name: 'mediaOrderSplit',
      title: 'Mobile Media Order',
      type: 'string',
      description:
        'Whether the image comes before or after the text once the columns stack on small screens.',
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
    ...mediaOrderStackedFields,
    heroLayoutField,
  ];
};
