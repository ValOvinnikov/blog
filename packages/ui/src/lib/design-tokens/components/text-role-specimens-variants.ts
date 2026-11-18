import { tv } from '@shinefold/ui/lib/styling';

export const textRoleSpecimensVariants = tv({
  slots: {
    grid: ['grid gap-6 md:grid-cols-2'],
    panel: ['bg-primary p-6 text-text'],
    row: ['@container/card'],
    figures: ['@container/figures'],
  },
  variants: {
    isDark: {
      true: { panel: ['dark'] },
    },
  },
});
