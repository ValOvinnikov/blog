import { tv } from '@blog/ui/lib/styling';

export const postMetaVariants = tv({
  slots: {
    root: [
      'flex flex-wrap items-center gap-2',
      'border-y border-border py-[9px]',
      'font-mono text-label text-subtle',
    ],
    author: ['flex items-center gap-2'],
    authorName: [
      'text-text font-medium no-underline',
      'transition-colors duration-base ease-console',
      'hover:text-accent',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
      'focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
    ],
    share: ['ml-auto'],
  },
});
