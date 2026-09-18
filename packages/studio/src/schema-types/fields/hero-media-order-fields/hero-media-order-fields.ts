import {
  HERO_VARIANT,
  MEDIA_ORDER,
  type THeroVariant,
} from '@blog/config/constants';
import { toTitleCase } from '@blog/utils/primitives';
import { defineField } from 'sanity';

type THeroMediaOrderParent = { variant?: string };

const isNotVariant =
  (variant: THeroVariant) =>
  ({ parent }: { parent?: unknown }): boolean =>
    (parent as THeroMediaOrderParent | undefined)?.variant !== variant;

export const heroMediaOrderFields = () => [
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
    hidden: isNotVariant(HERO_VARIANT.SPLIT),
  }),
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
    hidden: isNotVariant(HERO_VARIANT.STACKED),
  }),
];
