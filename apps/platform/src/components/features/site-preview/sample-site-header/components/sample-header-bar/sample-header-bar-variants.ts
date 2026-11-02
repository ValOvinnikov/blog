import { tv } from '@platform/utils/tv/tv';

export const sampleHeaderBarVariants = tv({
  slots: {
    root: ['flex h-16 flex-nowrap items-center justify-between gap-3'],
    controls: ['flex items-center gap-2'],
    menuButton: ['size-10 rounded-[8px]'],
  },
});
