import { tv } from '@blog/ui/lib/styling';

export const consentBannerVariants = tv({
  slots: {
    root: [
      'fixed inset-x-0 bottom-0 z-40 w-full',
      'sm:inset-x-auto sm:bottom-4 sm:left-4 sm:w-[min(24rem,calc(100vw-2rem))]',
      'flex flex-col gap-3 p-4',
      'border-t border-border bg-surface shadow-lg',
      'sm:rounded-md sm:border',
    ],
    heading: ['text-text'],
    message: [],
    actions: ['flex flex-wrap items-center gap-2 pt-1'],
    settings: ['ml-auto'],
  },
});
