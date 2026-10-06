import { HERO_VARIANT, MEDIA_ORDER } from '@blog/config/constants';
import { isNotHeroVariant } from '@blog/studio/schema-types/fields/hero-variant-field/hero-variant-predicate';
import { mediaOrderField } from '@blog/studio/schema-types/fields/media-order-field/media-order-field';

export const heroMediaOrderSplitField = () =>
  mediaOrderField({
    name: 'mediaOrderSplit',
    title: 'Mobile Media Order',
    description:
      'Whether the image comes before or after the text once the columns stack on small screens.',
    initialValue: MEDIA_ORDER.LAST,
    hidden: isNotHeroVariant(HERO_VARIANT.SPLIT),
  });

export const heroMediaOrderStackedField = () =>
  mediaOrderField({
    name: 'mediaOrderStacked',
    title: 'Media Order',
    description: 'Whether the image comes before or after the text.',
    initialValue: MEDIA_ORDER.LAST,
    hidden: isNotHeroVariant(HERO_VARIANT.STACKED),
  });
