import { CONTENT_ALIGNMENT } from '@shinefold/config';

import { SCRIM_POSITION } from './scrims';

export const BANNER_LAYOUT = [
  'isolate grid content-center justify-center overflow-hidden rounded-none',
  'grid-cols-[min(100%,calc(var(--container-page)-2*var(--spacing-gutter)))]',
];

export const BANNER_POSITION = {
  [CONTENT_ALIGNMENT.LEFT]: {
    root: ['justify-items-center sm:justify-items-start'],
    overlay: SCRIM_POSITION[CONTENT_ALIGNMENT.LEFT],
  },
  [CONTENT_ALIGNMENT.CENTER]: {
    root: ['justify-items-center'],
    overlay: SCRIM_POSITION[CONTENT_ALIGNMENT.CENTER],
  },
  [CONTENT_ALIGNMENT.RIGHT]: {
    root: ['justify-items-center sm:justify-items-end'],
    overlay: SCRIM_POSITION[CONTENT_ALIGNMENT.RIGHT],
  },
};
