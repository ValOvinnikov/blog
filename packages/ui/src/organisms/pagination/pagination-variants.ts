import { tv } from '@blog/ui/lib/styling';

export const paginationVariants = tv({
  slots: {
    root: 'mt-8 flex items-center justify-center gap-2',
    list: 'm-0 flex list-none items-center gap-1 p-0',
    item: '',
    link: [
      'inline-flex h-9 min-w-9 items-center justify-center rounded-md px-2',
      'font-mono text-label',
      'transition-colors duration-base ease-console',
      'text-subtle hover:text-text',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
      'focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
    ],
  },
  variants: {
    current: {
      true: { link: 'text-accent' },
    },
  },
});
