import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const statusBadgeVariants = tv({
  base: [
    'inline-flex items-center',
    'rounded-sm border',
    'px-2 py-0.5',
    'font-mono text-label font-medium uppercase tracking-label',
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
