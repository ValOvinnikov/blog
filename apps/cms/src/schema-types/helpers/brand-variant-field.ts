import type { TBrandVariant } from '@blog/config';
import { BRAND_VARIANT } from '@blog/config/constants';
import { toTitleCase } from '@blog/utils';
import { defineField } from 'sanity';

export const brandVariantField = (options?: { list?: TBrandVariant[] }) =>
  defineField({
    name: 'brandVariant',
    title: 'Brand Variant',
    type: 'string',
    description: 'Background tone for this section — required.',
    options: {
      list: (
        options?.list ?? [BRAND_VARIANT.PRIMARY, BRAND_VARIANT.SECONDARY]
      ).map((value) => ({ title: toTitleCase(value), value })),
    },
    validation: (rule) => rule.required(),
  });
