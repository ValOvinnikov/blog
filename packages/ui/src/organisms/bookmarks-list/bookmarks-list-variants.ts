import { tv } from '@blog/ui/lib/styling';

export const bookmarksListVariants = tv({
  slots: {
    root: ['font-mono text-card-copy'],
    list: ['m-0 list-none p-0'],
    row: [
      'flex items-center gap-[1.4ch]',
      'border-b border-dashed border-border py-[0.28rem]',
    ],
    date: ['text-subtle'],
    filename: [
      'text-accent',
      'transition-colors duration-base ease-console',
      'hover:text-accent-hover hover:underline',
      'rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
      'focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
    ],
    hint: ['mt-2 text-label text-subtle'],
    emptyMessage: ['text-copy text-muted'],
  },
});
