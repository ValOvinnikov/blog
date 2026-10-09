import { tv } from '@platform/utils/tv/tv';

export const sampleSiteHeaderVariants = tv({
  slots: {
    root: [
      'flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3',
    ],
    brand: ['flex items-center gap-2'],
    brandName: ['text-base font-semibold text-text'],
    nav: ['flex items-center gap-4'],
  },
});
