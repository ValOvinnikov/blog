import { tv } from '@platform/utils/tv/tv';

export const specimenPageVariants = tv({
  slots: {
    root: ['flex flex-col items-center gap-5 py-6 text-center'],
    copy: ['max-w-copy mx-auto'],
    actions: ['flex flex-wrap items-center justify-center gap-3'],
  },
});
