import { tv } from '@blog/ui/lib/styling';

export const signInPanelSentVariants = tv({
  slots: {
    badge: [
      'inline-grid size-10 place-items-center',
      'rounded-full bg-success-muted text-success',
    ],
    message: ['font-display text-sm text-text'],
    reset: ['self-start'],
  },
});
