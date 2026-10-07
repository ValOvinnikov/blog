import { HERO_VARIANT } from '@blog/config/constants';
import { alignmentFields } from '@blog/studio/schema-types/fields/alignment-fields/alignment-fields';
import { contentPositionFields } from '@blog/studio/schema-types/fields/content-position-fields/content-position-fields';
import { HERO_FIELDSET_CONTENT_POSITION } from '@blog/studio/schema-types/modules/hero-fieldsets/hero-fieldsets';

export const heroContentPositionFields = () => [
  ...alignmentFields([], {
    hasActions: true,
    fieldset: HERO_FIELDSET_CONTENT_POSITION,
  }),
  ...contentPositionFields({
    splitValue: HERO_VARIANT.SPLIT,
    bannerValue: HERO_VARIANT.BANNER,
    fieldset: HERO_FIELDSET_CONTENT_POSITION,
  }),
];
