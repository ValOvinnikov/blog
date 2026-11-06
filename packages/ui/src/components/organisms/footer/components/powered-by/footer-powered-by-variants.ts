import { FOCUS_RING, TRANSITION_COLORS, tv } from '@blog/ui/lib/styling';

export const footerPoweredByVariants = tv({
  slots: {
    root: [
      'group/powered-by rounded-sm whitespace-nowrap',
      'font-mono text-meta text-muted hover:text-text',
      '@min-[40rem]/footer:ms-auto group-data-[layout=CENTRED]/footer:ms-0',
      TRANSITION_COLORS,
      FOCUS_RING,
    ],
    name: [
      'font-medium',
      'underline decoration-transparent decoration-1 underline-offset-3',
      'group-hover/powered-by:decoration-current group-focus-visible/powered-by:decoration-transparent',
      TRANSITION_COLORS,
    ],
  },
});
