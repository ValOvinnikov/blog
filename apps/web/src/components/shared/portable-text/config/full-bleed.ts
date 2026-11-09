export const FULL_BLEED_DATA_ATTR = 'data-full-bleed';

// Elements carrying `FULL_BLEED_DATA_ATTR` are excluded here so they can reach their own breakout width instead of being capped to the text measure.
export const proseMeasureCapSlot = [
  '[&>*:not([data-full-bleed])]:mx-auto',
  '[&>*:not([data-full-bleed])]:max-w-measure',
  '[&>*:not([data-full-bleed])]:lg:mx-0',
  '[&>*+*]:mt-6',
];

// Below `lg` a table keeps the text measure and scrolls; from `lg` it takes the width a layout sets in `--full-bleed-table-width`, else its column's.
export const FULL_BLEED_TABLE = [
  'mx-auto max-w-measure',
  'lg:relative lg:left-1/2 lg:mx-0 lg:w-[var(--full-bleed-table-width,100%)] lg:max-w-none lg:-translate-x-1/2',
];
