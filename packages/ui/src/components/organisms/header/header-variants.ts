import { tv } from '@blog/ui/lib/styling';

export const headerVariants = tv({
  slots: {
    root: ['w-full', 'bg-primary border-b border-border', 'sticky top-0 z-10'],
    inner: [
      'flex flex-wrap items-center justify-between gap-x-5 gap-y-3',
      'mx-auto w-full max-w-page px-gutter py-3',
    ],
    navActionsGroup: ['flex min-w-0 flex-wrap items-center gap-4'],
  },
});
