import {
  BRAND_VARIANT,
  FULL_BRAND_VARIANT_LIST,
  HERO_VARIANT,
} from '@blog/config/constants';
import { brandVariantField } from '@blog/studio/schema-types/fields/brand-variant-field/brand-variant-field';
import { variantField } from '@blog/studio/schema-types/fields/variant-field/variant-field';

export const heroBackgroundAndShapeFields = () => [
  brandVariantField({
    list: FULL_BRAND_VARIANT_LIST,
    initialValue: BRAND_VARIANT.BRAND_PRIMARY,
    descriptionSuffix: ' On a Banner, this tints the image.',
  }),
  variantField({
    values: HERO_VARIANT,
    initialValue: HERO_VARIANT.SPLIT,
    description:
      'Split puts the image beside the copy, Stacked puts it above or below the copy, Banner uses it as a full-bleed background.',
  }),
];
