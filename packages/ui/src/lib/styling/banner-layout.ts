import { CONTENT_ALIGNMENT } from '@blog/config';

export const BANNER_LAYOUT = [
  'isolate grid content-center justify-center overflow-hidden rounded-none',
  'grid-cols-[min(100%,calc(var(--container-page)-2*var(--spacing-gutter)))]',
];

export const BANNER_POSITION = {
  [CONTENT_ALIGNMENT.LEFT]: {
    root: ['justify-items-center sm:justify-items-start'],
  },
  [CONTENT_ALIGNMENT.CENTER]: { root: ['justify-items-center'] },
  [CONTENT_ALIGNMENT.RIGHT]: {
    root: ['justify-items-center sm:justify-items-end'],
  },
};
