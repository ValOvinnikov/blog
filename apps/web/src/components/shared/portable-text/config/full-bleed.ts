export const FULL_BLEED_DATA_ATTR = 'data-full-bleed';

const CENTRED_MEASURE = 'mx-auto max-w-measure';

// Below `lg` the container takes the measure, so `ch` resolves at the prose size rather than each heading's; elements carrying `FULL_BLEED_DATA_ATTR` stay uncapped from `lg`.
export const proseMeasureCapSlot = [
  CENTRED_MEASURE,
  'lg:mx-0 lg:max-w-none',
  'lg:[&>*:not([data-full-bleed])]:max-w-measure',
  '[&>*+*]:mt-6',
];

// Below `lg` a table keeps the text measure and scrolls; from `lg` it takes the width a layout sets in `--full-bleed-table-width`, else its column's.
export const FULL_BLEED_TABLE = [
  CENTRED_MEASURE,
  'lg:relative lg:left-1/2 lg:mx-0 lg:w-[var(--full-bleed-table-width,100%)] lg:max-w-none lg:-translate-x-1/2',
];
