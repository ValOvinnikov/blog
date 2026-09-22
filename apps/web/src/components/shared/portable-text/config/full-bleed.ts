export const FULL_BLEED_DATA_ATTR = 'data-full-bleed';

export const proseMeasureCapSlot = [
  `[&>*:not([${FULL_BLEED_DATA_ATTR}])]:mx-auto`,
  `[&>*:not([${FULL_BLEED_DATA_ATTR}])]:max-w-measure`,
  `[&>*:not([${FULL_BLEED_DATA_ATTR}])]:lg:mx-0`,
  '[&>*+*]:mt-6',
];
