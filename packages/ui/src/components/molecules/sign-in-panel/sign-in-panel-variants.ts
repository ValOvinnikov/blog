import { POPOVER_SURFACE, tv } from '@blog/ui/lib/styling';

export const signInPanelVariants = tv({
  slots: {
    root: [POPOVER_SURFACE, 'gap-2'],
    title: ['font-display text-copy font-semibold text-text'],
    providers: ['mt-1 flex flex-col gap-2'],
    or: [
      'my-1.5 flex items-center gap-2.5',
      'font-mono text-meta text-muted',
      'before:h-px before:flex-1 before:bg-border',
      'after:h-px after:flex-1 after:bg-border',
    ],
    hint: ['mt-1 font-mono text-meta text-muted'],
  },
});
