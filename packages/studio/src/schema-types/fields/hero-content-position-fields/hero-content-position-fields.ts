import { CONTENT_ALIGNMENT, HERO_VARIANT } from '@shinefold/config/constants';
import { alignmentFields } from '@shinefold/studio/schema-types/fields/alignment-fields/alignment-fields';
import { contentPositionFields } from '@shinefold/studio/schema-types/fields/content-position-fields/content-position-fields';
import { HERO_FIELDSET_CONTENT_POSITION } from '@shinefold/studio/schema-types/modules/hero-fieldsets/hero-fieldsets';

export const heroContentPositionFields = () => [
  ...alignmentFields([], {
    hasActions: true,
    allow: Object.values(CONTENT_ALIGNMENT),
    fieldset: HERO_FIELDSET_CONTENT_POSITION,
  }),
  ...contentPositionFields({
    splitValue: HERO_VARIANT.SPLIT,
    bannerValue: HERO_VARIANT.BANNER,
    fieldset: HERO_FIELDSET_CONTENT_POSITION,
  }),
];
