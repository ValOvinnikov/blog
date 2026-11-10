import {
  FOCUS_RING,
  MENU_ROW,
  TRANSITION_COLORS,
  tv,
} from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const popoverMenuItemVariants = tv({
  base: [
    'flex w-full items-center gap-2',
    'rounded-md px-3 py-2',
    'font-display text-sm text-text',
    TRANSITION_COLORS,
    'hover:text-brand-primary',
    FOCUS_RING,
  ],
  variants: {
    variant: {
      bordered: [
        'justify-start rounded-sm border border-border-strong bg-surface px-3.5 py-2',
        'font-mono text-label text-text',
        'hover:border-brand-primary hover:bg-surface hover:text-brand-primary',
      ],
      outlined: [
        'justify-center rounded-sm border border-border-strong bg-transparent',
        'font-medium',
        'hover:border-brand-primary hover:bg-transparent',
      ],
      tile: [
        'flex-col items-start gap-1.5 item-card rounded-item p-3',
        'hover:bg-surface-2',
      ],
    },
  },
  compoundVariants: [{ variant: undefined, class: MENU_ROW }],
});

export type TPopoverMenuItemVariants = VariantProps<
  typeof popoverMenuItemVariants
>;
