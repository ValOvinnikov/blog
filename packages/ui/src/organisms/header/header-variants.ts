import { tv } from '@blog/ui/lib/styling';

export const headerVariants = tv({
  slots: {
    root: [
      'flex flex-wrap items-center justify-between gap-x-5 gap-y-3',
      'w-full px-gutter py-3',
      'bg-primary border-b border-border',
      'sticky top-0 z-10',
    ],
    navActionsGroup: ['flex min-w-0 flex-wrap items-center gap-4'],
  },
});
