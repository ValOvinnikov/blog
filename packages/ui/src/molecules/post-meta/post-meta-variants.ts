import { tv } from '@blog/ui/lib/styling';

export const postMetaVariants = tv({
  slots: {
    root: [
      'flex flex-wrap items-center gap-2',
      'border-y border-border py-[9px]',
      'font-mono text-label text-subtle',
    ],
    author: ['flex items-center gap-2'],
    authorName: ['text-text font-medium'],
    share: ['ml-auto'],
  },
});
