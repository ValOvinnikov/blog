import { tv } from '@blog/ui/lib/styling';

export const accountMenuGroupVariants = tv({
  slots: {
    root: ['group/account w-full'],
    row: [
      'group flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-md px-3',
      'font-mono text-meta text-text',
      'list-none hover:bg-surface-2',
      '[&::-webkit-details-marker]:hidden',
    ],
    glyph: ['text-muted group-hover:text-text'],
    chevron: [
      'ms-auto text-muted',
      'motion-safe:transition-transform motion-safe:duration-fast',
      'group-open/account:rotate-180',
    ],
    panel: [
      'static mt-1 w-full min-w-0',
      'border-0 bg-transparent shadow-none',
    ],
  },
});
