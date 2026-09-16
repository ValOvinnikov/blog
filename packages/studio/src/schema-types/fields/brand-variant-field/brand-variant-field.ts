import { BRAND_VARIANT, type TBrandVariant } from '@blog/config/constants';
import { toTitleCase } from '@blog/utils/primitives';
import { defineField } from 'sanity';

const DEFAULT_LIST: readonly TBrandVariant[] = [
  BRAND_VARIANT.PRIMARY,
  BRAND_VARIANT.SECONDARY,
];

export const brandVariantField = (options?: {
  list?: readonly TBrandVariant[];
  description?: string;
  initialValue?: TBrandVariant;
}) => {
  const list = options?.list ?? DEFAULT_LIST;

  return defineField({
    name: 'brandVariant',
    title: 'Brand Variant',
    type: 'string',
    description:
      options?.description ??
      "Which brand color this section's background uses.",
    options: {
      list: list.map((value) => ({ title: toTitleCase(value), value })),
    },
    initialValue: options?.initialValue ?? list[0],
    validation: (rule) => rule.required(),
  });
};
