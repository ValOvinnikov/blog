import { tv } from '@blog/ui/lib/styling';

export const postMetaVariants = tv({
  slots: {
    root: [
      'my-4 flex flex-wrap items-center gap-2 border-y border-border py-2',
      'font-mono text-label text-subtle',
    ],
    author: ['flex items-center gap-2'],
    authorName: ['text-text font-medium'],
    share: ['ml-auto'],
  },
});
