import { tv } from '@blog/ui/lib/styling';

export const primaryNavigationVariants = tv({
  slots: {
    root: ['relative flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2'],
    links: ['flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2'],
    toggle: ['shrink-0'],
    panel: [
      'absolute inset-x-0 top-full z-20',
      'flex flex-col items-start gap-3 p-4',
      'bg-bg border-b border-border',
    ],
  },
  variants: {
    collapsible: {
      true: {
        links: ['hidden md:flex'],
        toggle: ['md:hidden'],
        panel: ['md:hidden'],
      },
    },
  },
});
