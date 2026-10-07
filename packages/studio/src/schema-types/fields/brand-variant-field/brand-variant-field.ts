import {
  BRAND_VARIANT,
  FULL_BRAND_VARIANT_LIST,
  type TBrandVariant,
} from '@blog/config/constants';
import { defineField, type StringDefinition } from 'sanity';

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
  list = FULL_BRAND_VARIANT_LIST,
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
