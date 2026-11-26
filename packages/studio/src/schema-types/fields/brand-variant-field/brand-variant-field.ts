import { SKIN_REGISTRY } from '@shinefold/config';
import { BRAND_VARIANT, type TBrandVariant } from '@shinefold/config/constants';
import type { TMaybeUndefined } from '@shinefold/config/types';
import { keys } from 'remeda';
import { defineField, type StringDefinition } from 'sanity';

const brandVariantOptions = keys(SKIN_REGISTRY).map((value) => ({
  title: SKIN_REGISTRY[value].title,
  value,
}));

export const brandVariantTitle = (value: unknown): TMaybeUndefined<string> =>
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
  list = keys(SKIN_REGISTRY),
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
