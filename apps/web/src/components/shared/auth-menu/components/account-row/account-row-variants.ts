import { tv } from '@blog/ui/lib/styling';

export const accountRowVariants = tv({
  slots: {
    root: [
      'group flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-md px-3',
      'font-mono text-meta text-text',
      'hover:bg-surface-2',
    ],
    glyph: ['text-muted group-hover:text-text'],
  },
});
