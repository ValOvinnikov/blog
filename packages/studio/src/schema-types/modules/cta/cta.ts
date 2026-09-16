import {
  BRAND_VARIANT,
  CONTENT_ALIGNMENT,
  CTA_VARIANT,
  FULL_BRAND_VARIANT_LIST,
  MEDIA_ORDER,
  type TCtaVariant,
} from '@blog/config/constants';
import { alignmentFields } from '@blog/studio/schema-types/fields/alignment-fields/alignment-fields';
import { brandVariantField } from '@blog/studio/schema-types/fields/brand-variant-field/brand-variant-field';
import { ctaButtonsField } from '@blog/studio/schema-types/fields/cta-buttons-field/cta-buttons-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { headingBlockField } from '@blog/studio/schema-types/objects/heading-block/heading-block-field';
import { imageWithAltSchema } from '@blog/studio/schema-types/objects/image-with-alt/image-with-alt';
import { layoutField } from '@blog/studio/schema-types/objects/layout/layout-field';
import { inlineTextSchema } from '@blog/studio/schema-types/portable-text/inline-text/inline-text';
import { toTitleCase } from '@blog/utils/primitives';
import { Megaphone } from 'lucide-react';
import { defineField, defineType } from 'sanity';

type TCtaParent = { variant?: string; brandVariant?: string };

const isVariant = (parent: unknown, variant: TCtaVariant) =>
  (parent as TCtaParent | undefined)?.variant === variant;

const isNotSplitVariant = ({ parent }: { parent?: unknown }) =>
  !isVariant(parent, CTA_VARIANT.SPLIT);

const isBannerVariant = ({ parent }: { parent?: unknown }) =>
  isVariant(parent, CTA_VARIANT.BANNER);

const isNotBannerVariant = ({ parent }: { parent?: unknown }) =>
  !isVariant(parent, CTA_VARIANT.BANNER);

export const ctaSchema = defineType({
  name: 'module_cta',
  title: 'Call to Action',
  type: 'document',
  description:
    'A focused section that asks the reader to do one thing — subscribe, get in touch, read on — with a headline, a line of copy, up to two actions and an optional image.',
  icon: Megaphone,
  fields: [
    titleField(),
    brandVariantField({
      list: FULL_BRAND_VARIANT_LIST,
      description: 'Fill color of the card itself.',
      initialValue: BRAND_VARIANT.SECONDARY,
    }),
    headingBlockField(),
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow',
      type: 'string',
      description: 'Short line above the heading.',
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: imageWithAltSchema.name,
      description: 'Optional image, placed according to the Variant.',
      validation: (rule) =>
        rule.custom((value, context) => {
          const variant = (context.parent as TCtaParent | undefined)?.variant;

          if (
            !value &&
            (variant === CTA_VARIANT.BANNER || variant === CTA_VARIANT.SPLIT)
          ) {
            return 'Image is required for the Banner and Split variants.';
          }

          return true;
        }),
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: inlineTextSchema.name,
      description: 'Optional longer text below the heading.',
    }),
    ctaButtonsField(),
    defineField({
      name: 'footnote',
      title: 'Footnote',
      type: 'string',
      description: 'Small print below the actions.',
      validation: (rule) => rule.max(120),
    }),
    defineField({
      name: 'variant',
      title: 'Variant',
      type: 'string',
      description: 'Which shape this section takes.',
      options: {
        layout: 'dropdown',
        list: Object.values(CTA_VARIANT).map((value) => ({
          title: toTitleCase(value),
          value,
        })),
      },
      initialValue: CTA_VARIANT.CALLOUT,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'bandTone',
      title: 'Band Tone',
      type: 'string',
      description: 'Background color of the full-width band behind the card.',
      options: {
        list: FULL_BRAND_VARIANT_LIST.map((value) => ({
          title: toTitleCase(value),
          value,
        })),
      },
      initialValue: BRAND_VARIANT.PRIMARY,
      hidden: isBannerVariant,
      validation: (rule) => [
        rule.required(),
        rule
          .custom((value, context) => {
            const parent = context.parent as TCtaParent | undefined;

            if (parent?.variant === CTA_VARIANT.BANNER) {
              return true;
            }

            return value !== undefined && value === parent?.brandVariant
              ? 'Band Tone matches Brand Variant — the band and card will blend together. Sometimes that’s intentional, but usually they should contrast.'
              : true;
          })
          .warning(),
      ],
    }),
    ...alignmentFields([
      {
        name: 'contentPositionSplit',
        title: 'Content Position',
        description: 'Which side of the image the text sits on.',
        allow: [CONTENT_ALIGNMENT.LEFT, CONTENT_ALIGNMENT.RIGHT],
        initialValue: CONTENT_ALIGNMENT.LEFT,
        hidden: isNotSplitVariant,
      },
      {
        name: 'contentPositionBanner',
        title: 'Content Position',
        description: 'Where the text sits over the background image.',
        allow: [
          CONTENT_ALIGNMENT.LEFT,
          CONTENT_ALIGNMENT.CENTER,
          CONTENT_ALIGNMENT.RIGHT,
        ],
        initialValue: CONTENT_ALIGNMENT.LEFT,
        hidden: isNotBannerVariant,
      },
    ]),
    defineField({
      name: 'mobileMediaOrder',
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
      hidden: isNotSplitVariant,
    }),
    layoutField,
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'headingBlock.heading',
    },
    prepare({ title, subtitle }) {
      return {
        title: title ?? 'Unknown',
        subtitle,
      };
    },
  },
});
