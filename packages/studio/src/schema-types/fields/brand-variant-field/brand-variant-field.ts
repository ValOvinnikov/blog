import { BRAND_VARIANT, type TBrandVariant } from '@blog/config/constants';
import { defineField, type StringDefinition } from 'sanity';

const DEFAULT_LIST: readonly TBrandVariant[] = [
  BRAND_VARIANT.PRIMARY,
  BRAND_VARIANT.SECONDARY,
];

const brandVariantOptions = [
  { title: 'Plain', value: BRAND_VARIANT.PRIMARY },
  { title: 'Shaded', value: BRAND_VARIANT.SECONDARY },
  { title: 'Brand tint', value: BRAND_VARIANT.BRAND_PRIMARY },
];

export const brandVariantTitle = (value: unknown): string | undefined =>
  brandVariantOptions.find((option) => option.value === value)?.title;

type TBrandVariantFieldOptions = {
  name?: string;
  title?: string;
  description?: string;
  descriptionSuffix?: string;
  list?: readonly TBrandVariant[];
  initialValue?: TBrandVariant;
  hidden?: StringDefinition['hidden'];
  validation?: StringDefinition['validation'];
};

export const brandVariantField = ({
  name = 'brandVariant',
  title = 'Background',
  description = 'The background this section sits on.',
  descriptionSuffix = '',
  list = DEFAULT_LIST,
  initialValue = BRAND_VARIANT.PRIMARY,
  hidden,
  validation = (rule) => rule.required(),
}: TBrandVariantFieldOptions = {}) =>
  defineField({
    name,
    title,
    type: 'string',
    description: `${description}${descriptionSuffix}`,
    options: {
      layout: 'dropdown',
      list: brandVariantOptions.filter((option) => list.includes(option.value)),
    },
    initialValue,
    hidden,
    validation,
  });
