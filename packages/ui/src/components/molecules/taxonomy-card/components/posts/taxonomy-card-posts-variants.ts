import { tv } from '@blog/ui/lib/styling';

export const taxonomyCardPostsVariants = tv({
  slots: {
    root: ['mt-1 flex flex-col gap-2 border-t border-divider pt-3'],
    label: ['m-0 font-mono text-meta text-subtle'],
    list: ['m-0 flex list-none flex-col gap-1 p-0'],
    link: ['relative block truncate font-display text-copy'],
  },
});
