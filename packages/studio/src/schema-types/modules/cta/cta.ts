import {
  BRAND_VARIANT,
  CONTENT_ALIGNMENT,
  CTA_VARIANT,
  MEDIA_ORDER,
} from '@shinefold/config/constants';
import type { TMaybeUndefined } from '@shinefold/config/types';
import { alignmentFields } from '@shinefold/studio/schema-types/fields/alignment-fields/alignment-fields';
import { brandVariantField } from '@shinefold/studio/schema-types/fields/brand-variant-field/brand-variant-field';
import { contentPositionFields } from '@shinefold/studio/schema-types/fields/content-position-fields/content-position-fields';
import { ctaButtonsField } from '@shinefold/studio/schema-types/fields/cta-buttons-field/cta-buttons-field';
import { localizedListedTextField } from '@shinefold/studio/schema-types/fields/localized-listed-text-field/localized-listed-text-field';
import { localizedOneLineTextField } from '@shinefold/studio/schema-types/fields/localized-one-line-text-field/localized-one-line-text-field';
import { mediaOrderField } from '@shinefold/studio/schema-types/fields/media-order-field/media-order-field';
import { titleField } from '@shinefold/studio/schema-types/fields/title-field/title-field';
import { variantField } from '@shinefold/studio/schema-types/fields/variant-field/variant-field';
import { isNotVariant } from '@shinefold/studio/schema-types/fields/variant-field/variant-predicate';
import { ctaLayoutField } from '@shinefold/studio/schema-types/objects/cta-layout/cta-layout-field';
import { localizedImageWithAltSchema } from '@shinefold/studio/schema-types/objects/localized-image-with-alt/localized-image-with-alt';
import { moduleHeadingBlockField } from '@shinefold/studio/schema-types/objects/module-heading-block/module-heading-block-field';
import { defaultLanguageValue } from '@shinefold/studio/schema-types/validation/default-language-value/default-language-value';
import { validateLocalizedMaxLength } from '@shinefold/studio/schema-types/validation/validate-localized-max-length/validate-localized-max-length';
import { isUndefined } from '@shinefold/utils/primitives';
import { Megaphone } from 'lucide-react';
import { defineField, defineType } from 'sanity';

const FOOTNOTE_MAX_LENGTH = 120;

type TCtaParent = { variant?: string; brandVariant?: string };

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
      title: 'Card background',
      description: 'The fill of the card itself.',
      initialValue: BRAND_VARIANT.SECONDARY,
    }),
    brandVariantField({
      name: 'bandTone',
      description: 'The background behind the card.',
      initialValue: BRAND_VARIANT.PRIMARY,
      hidden: ({ parent }) =>
        (parent as TMaybeUndefined<TCtaParent>)?.variant === CTA_VARIANT.BANNER,
      validation: (rule) => [
        rule.required(),
        rule
          .custom((value, context) => {
            const parent = context.parent as TMaybeUndefined<TCtaParent>;

            if (parent?.variant === CTA_VARIANT.BANNER) {
              return true;
            }

            return !isUndefined(value) && value === parent?.brandVariant
              ? 'Background matches Card background — the card will blend into the section. Sometimes that’s intentional, but usually they should contrast.'
              : true;
          })
          .warning(),
      ],
    }),
    variantField({
      values: CTA_VARIANT,
      initialValue: CTA_VARIANT.CALLOUT,
      description:
        'Callout is a card on the section background, Split puts the image beside the copy, Banner uses it as a full-bleed background.',
    }),
    moduleHeadingBlockField(),
    localizedOneLineTextField({
      name: 'eyebrow',
      title: 'Eyebrow',
      description: 'Short line above the heading.',
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: localizedImageWithAltSchema.name,
      description: 'Optional image, placed according to the Shape.',
      validation: (rule) =>
        rule.custom<{ asset?: unknown }>((value, context) => {
          const variant = (context.parent as TMaybeUndefined<TCtaParent>)
            ?.variant;

          if (
            !value?.asset &&
            (variant === CTA_VARIANT.BANNER || variant === CTA_VARIANT.SPLIT)
          ) {
            return 'Image is required for the Banner and Split shapes.';
          }

          return true;
        }),
    }),
    localizedListedTextField({
      description: 'Optional longer text below the heading.',
    }),
    ctaButtonsField(),
    localizedOneLineTextField({
      name: 'footnote',
      title: 'Footnote',
      description: 'Small print below the actions.',
      validation: (rule) =>
        rule.custom(
          validateLocalizedMaxLength(
            FOOTNOTE_MAX_LENGTH,
            `Keep each footnote to ${FOOTNOTE_MAX_LENGTH} characters or fewer.`,
          ),
        ),
    }),
    ...alignmentFields([], {
      hasActions: true,
      allow: Object.values(CONTENT_ALIGNMENT),
    }),
    ...contentPositionFields({
      splitValue: CTA_VARIANT.SPLIT,
      bannerValue: CTA_VARIANT.BANNER,
    }),
    mediaOrderField({
      isAlwaysStacked: false,
      name: 'mobileMediaOrder',
      initialValue: MEDIA_ORDER.LAST,
      hidden: isNotVariant(CTA_VARIANT.SPLIT),
    }),
    ctaLayoutField,
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'headingBlock.heading',
    },
    prepare({ title, subtitle }) {
      return {
        title: title ?? 'Unknown',
        subtitle: defaultLanguageValue(subtitle),
      };
    },
  },
});
