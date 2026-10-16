import { tv } from '@blog/ui/lib/styling';

export const bookmarksListVariants = tv({
  slots: {
    root: ['font-mono text-card-copy'],
    list: ['m-0 list-none p-0'],
    row: [
      'flex items-center gap-[1.4ch]',
      'border-b border-dashed border-divider py-[0.28rem]',
    ],
    date: ['text-subtle'],
    hint: ['mt-2 text-label text-subtle'],
    emptyMessage: ['text-copy text-muted'],
  },
});
