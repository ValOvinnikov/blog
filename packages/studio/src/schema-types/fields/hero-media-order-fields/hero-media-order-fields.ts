import { HERO_VARIANT, MEDIA_ORDER } from '@blog/config/constants';
import { mediaOrderField } from '@blog/studio/schema-types/fields/media-order-field/media-order-field';
import { isNotVariant } from '@blog/studio/schema-types/fields/variant-field/variant-predicate';

export const heroMediaOrderSplitField = () =>
  mediaOrderField({
    kind: 'MOBILE',
    name: 'mediaOrderSplit',
    initialValue: MEDIA_ORDER.LAST,
    hidden: isNotVariant(HERO_VARIANT.SPLIT),
  });

export const heroMediaOrderStackedField = () =>
  mediaOrderField({
    kind: 'STACKED',
    name: 'mediaOrderStacked',
    initialValue: MEDIA_ORDER.LAST,
    hidden: isNotVariant(HERO_VARIANT.STACKED),
  });
