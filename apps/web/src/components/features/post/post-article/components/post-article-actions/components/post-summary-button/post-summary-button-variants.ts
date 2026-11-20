import { tv } from '@shinefold/ui/lib/styling';

export const postSummaryButtonVariants = tv({
  slots: {
    chevron: ['shrink-0 transition-transform duration-base ease-smooth'],
  },
  variants: {
    isOpen: {
      true: { chevron: ['rotate-180'] },
    },
  },
});
