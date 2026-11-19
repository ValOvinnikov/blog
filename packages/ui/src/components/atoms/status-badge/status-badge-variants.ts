import { TEXT_ROLE } from '@shinefold/config';
import { tv, TYPOGRAPHY } from '@shinefold/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const statusBadgeVariants = tv({
  base: [
    'inline-flex items-center',
    'rounded-button border',
    'px-2 py-0.5',
    TYPOGRAPHY[TEXT_ROLE.LABEL],
  ],
  variants: {
    tone: {
      ok: 'border-success bg-success-muted text-success',
      warn: 'border-warn bg-warn-muted text-warn',
      neutral: 'border-border bg-surface-2 text-text-muted',
    },
  },
  defaultVariants: { tone: 'neutral' },
});

export type TStatusBadgeVariants = VariantProps<typeof statusBadgeVariants>;
