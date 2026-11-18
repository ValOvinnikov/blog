import { CONTENT_ALIGNMENT } from '@shinefold/config';

// Below lg the copy measure can span the band edge to edge, so no stop under it drops past mid; from lg the weak tail starts beyond the measure.
const SCRIM_CENTER =
  'bg-[linear-gradient(105deg,var(--scrim-mid)_0%,var(--scrim-strong)_35%,var(--scrim-strong)_65%,var(--scrim-mid)_100%)]';

export const SCRIM_POSITION = {
  [CONTENT_ALIGNMENT.LEFT]: [
    SCRIM_CENTER,
    'sm:bg-[linear-gradient(105deg,var(--scrim-strong)_0%,var(--scrim-mid)_55%,var(--scrim-mid)_100%)]',
    'lg:bg-[linear-gradient(105deg,var(--scrim-strong)_0%,var(--scrim-mid)_55%,var(--scrim-mid)_80%,var(--scrim-weak)_100%)]',
  ],
  [CONTENT_ALIGNMENT.CENTER]: [
    SCRIM_CENTER,
    'lg:bg-[linear-gradient(105deg,var(--scrim-weak)_0%,var(--scrim-mid)_10%,var(--scrim-strong)_35%,var(--scrim-strong)_65%,var(--scrim-mid)_90%,var(--scrim-weak)_100%)]',
  ],
  [CONTENT_ALIGNMENT.RIGHT]: [
    SCRIM_CENTER,
    'sm:bg-[linear-gradient(105deg,var(--scrim-mid)_0%,var(--scrim-mid)_45%,var(--scrim-strong)_100%)]',
    'lg:bg-[linear-gradient(105deg,var(--scrim-weak)_0%,var(--scrim-mid)_20%,var(--scrim-mid)_45%,var(--scrim-strong)_100%)]',
  ],
};
