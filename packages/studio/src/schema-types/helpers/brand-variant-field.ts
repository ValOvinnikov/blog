import { BRAND_VARIANT, type TBrandVariant } from '@blog/config/constants';
import { toTitleCase } from '@blog/utils/primitives';
import { defineField } from 'sanity';

export const brandVariantField = (options?: {
  list?: TBrandVariant[];
  description?: string;
}) =>
  defineField({
    name: 'brandVariant',
    title: 'Brand Variant',
    type: 'string',
    description:
      options?.description ?? 'Background tone for this section — required.',
    options: {
      list: (
        options?.list ?? [BRAND_VARIANT.PRIMARY, BRAND_VARIANT.SECONDARY]
      ).map((value) => ({ title: toTitleCase(value), value })),
    },
    validation: (rule) => rule.required(),
  });
