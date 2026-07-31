import { tv } from '@blog/ui/lib/styling';

export const primaryNavigationVariants = tv({
  slots: {
    root: ['relative flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2'],
    links: ['flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2'],
    toggle: ['shrink-0'],
    panel: [
      'absolute inset-x-0 top-full z-20',
      'flex flex-col items-start gap-1 p-2',
      'bg-bg border-b border-border shadow-lg',
    ],
    panelLink: [
      'flex w-full items-center',
      'rounded-md px-3 py-2',
      'hover:bg-surface-2',
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
