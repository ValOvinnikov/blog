import { tv } from '@platform/utils/tv/tv';

export const presetStripVariants = tv({
  slots: {
    root: ['relative min-w-0'],
    row: ['flex w-full min-w-0 flex-nowrap items-center gap-3'],
    measure: [
      'pointer-events-none invisible absolute top-0 left-0 flex w-max flex-nowrap gap-3',
    ],
  },
});
