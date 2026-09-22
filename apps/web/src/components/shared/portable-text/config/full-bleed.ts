export const FULL_BLEED_DATA_ATTR = 'data-full-bleed';

// Elements carrying `FULL_BLEED_DATA_ATTR` are excluded here so they can reach their own breakout width instead of being capped to the text measure.
export const proseMeasureCapSlot = [
  '[&>*:not([data-full-bleed])]:mx-auto',
  '[&>*:not([data-full-bleed])]:max-w-measure',
  '[&>*:not([data-full-bleed])]:lg:mx-0',
  '[&>*+*]:mt-6',
];
