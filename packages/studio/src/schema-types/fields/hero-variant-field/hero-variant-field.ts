import { HERO_VARIANT } from '@blog/config/constants';
import { toTitleCase } from '@blog/utils/primitives';
import { defineField } from 'sanity';

export const heroVariantField = () =>
  defineField({
    name: 'variant',
    title: 'Variant',
    type: 'string',
    description:
      'Split puts the image beside the copy, Stacked puts it below, Banner uses it as a full-bleed background.',
    options: {
      layout: 'dropdown',
      list: Object.values(HERO_VARIANT).map((value) => ({
        title: toTitleCase(value),
        value,
      })),
    },
    initialValue: HERO_VARIANT.SPLIT,
    validation: (rule) => rule.required(),
  });
