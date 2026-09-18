import { HERO_VARIANT, MEDIA_ORDER } from '@blog/config/constants';
import { isNotHeroVariant } from '@blog/studio/schema-types/fields/hero-variant-field/hero-variant-predicate';
import { toTitleCase } from '@blog/utils/primitives';
import { defineField } from 'sanity';

export const heroMediaOrderSplitField = () =>
  defineField({
    name: 'mediaOrderSplit',
    title: 'Mobile Media Order',
    type: 'string',
    description:
      'Whether the image comes before or after the text once the columns stack on small screens.',
    options: {
      layout: 'dropdown',
      list: Object.values(MEDIA_ORDER).map((value) => ({
        title: toTitleCase(value),
        value,
      })),
    },
    initialValue: MEDIA_ORDER.LAST,
    hidden: isNotHeroVariant(HERO_VARIANT.SPLIT),
  });

export const heroMediaOrderStackedField = () =>
  defineField({
    name: 'mediaOrderStacked',
    title: 'Media Order',
    type: 'string',
    description: 'Whether the image comes before or after the text.',
    options: {
      layout: 'dropdown',
      list: Object.values(MEDIA_ORDER).map((value) => ({
        title: toTitleCase(value),
        value,
      })),
    },
    initialValue: MEDIA_ORDER.LAST,
    hidden: isNotHeroVariant(HERO_VARIANT.STACKED),
  });
