import { FOCUS_RING, TRANSITION_COLORS, tv } from '@blog/ui/lib/styling';

export const signInPanelProviderVariants = tv({
  slots: {
    root: [
      'flex min-h-11 w-full items-center gap-2.5 px-3.5 text-left',
      'rounded-sm border border-border-strong bg-surface',
      'font-display text-sm font-medium text-text',
      TRANSITION_COLORS,
      'cursor-pointer hover:border-brand-primary hover:text-brand-primary',
      FOCUS_RING,
    ],
    spinner: ['text-current'],
  },
  variants: {
    isPending: {
      true: {
        root: ['cursor-progress hover:border-border-strong hover:text-text'],
      },
    },
    isWaiting: {
      true: {
        root: [
          'cursor-not-allowed',
          'border-border bg-surface-2 text-muted',
          'hover:border-border hover:text-muted',
        ],
      },
    },
  },
});
