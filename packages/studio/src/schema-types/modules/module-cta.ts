import {
  BRAND_VARIANT,
  CTA_IMAGE_SIDE,
  CTA_MOBILE_MEDIA_ORDER,
  CTA_VARIANT,
} from '@blog/config/constants';
import { actionGroupField } from '@blog/studio/schema-types/helpers/action-group-field';
import {
  brandVariantField,
  FULL_BRAND_VARIANT_LIST,
} from '@blog/studio/schema-types/helpers/brand-variant-field';
import { layoutField } from '@blog/studio/schema-types/helpers/layout-field';
import { sectionHeaderField } from '@blog/studio/schema-types/helpers/section-header-field';
import { titleField } from '@blog/studio/schema-types/helpers/title-field';
import { basicTextSchema } from '@blog/studio/schema-types/objects/blocks/basic-text';
import { imageWithAltSchema } from '@blog/studio/schema-types/objects/image-with-alt';
import { toTitleCase } from '@blog/utils/primitives';
import { Megaphone } from 'lucide-react';
import { defineField, defineType } from 'sanity';

type TCtaParent = { variant?: string; brandVariant?: string };

const isVariant = (parent: unknown, variant: string) =>
  (parent as TCtaParent | undefined)?.variant === variant;

const isSplitVariant = ({ parent }: { parent?: unknown }) =>
  !isVariant(parent, CTA_VARIANT.SPLIT);

const isBannerVariant = ({ parent }: { parent?: unknown }) =>
  isVariant(parent, CTA_VARIANT.BANNER);

export const ctaSchema = defineType({
  name: 'module_cta',
  title: 'Call to Action',
  type: 'document',
  icon: Megaphone,
  fields: [
    titleField(),
    defineField({
      name: 'variant',
      title: 'Variant',
      type: 'string',
      options: {
        layout: 'radio',
        list: Object.values(CTA_VARIANT).map((value) => ({
          title: toTitleCase(value),
          value,
        })),
      },
      initialValue: CTA_VARIANT.CALLOUT,
      validation: (rule) => rule.required(),
    }),
    brandVariantField({
      list: FULL_BRAND_VARIANT_LIST,
      description:
        'On this module: the card fill for Split/Callout, or the overlay tint for Banner — not the full-bleed band tone every other module uses this field for.',
      initialValue: BRAND_VARIANT.SECONDARY,
    }),
    defineField({
      name: 'bandTone',
      title: 'Band Tone',
      type: 'string',
      description:
        'Background tone for the full-bleed section band behind the CTA card — distinct from Brand Variant, which is the card’s own fill or overlay.',
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
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow',
      type: 'string',
      description: 'Optional kicker label shown above the heading.',
      validation: (rule) => rule.max(40),
    }),
    sectionHeaderField({ requireHeading: true }),
    defineField({
      name: 'content',
      title: 'Content',
      type: basicTextSchema.name,
      description: 'Optional rich text, separate from the supporting text.',
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: imageWithAltSchema.name,
      description:
        'Required for Banner (background) and Split (side); optional for Callout (above the content).',
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
      name: 'imageSide',
      title: 'Image Side',
      type: 'string',
      options: {
        layout: 'radio',
        list: Object.values(CTA_IMAGE_SIDE).map((value) => ({
          title: toTitleCase(value),
          value,
        })),
      },
      initialValue: CTA_IMAGE_SIDE.RIGHT,
      hidden: isSplitVariant,
    }),
    defineField({
      name: 'mobileMediaOrder',
      title: 'Mobile Media Order',
      type: 'string',
      options: {
        layout: 'radio',
        list: Object.values(CTA_MOBILE_MEDIA_ORDER).map((value) => ({
          title: toTitleCase(value),
          value,
        })),
      },
      initialValue: CTA_MOBILE_MEDIA_ORDER.LAST,
      hidden: isSplitVariant,
    }),
    actionGroupField(),
    defineField({
      name: 'footnote',
      title: 'Footnote',
      type: 'string',
      description: 'Optional small text shown below the actions.',
      validation: (rule) => rule.max(120),
    }),
    layoutField,
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'sectionHeader.heading',
    },
    prepare({ title, subtitle }) {
      return {
        title: title ?? 'Unknown',
        subtitle,
      };
    },
  },
});
