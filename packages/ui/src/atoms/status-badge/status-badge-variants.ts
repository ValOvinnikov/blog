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
      ok: 'border-ok bg-ok-muted text-ok',
      warn: 'border-warn bg-warn-muted text-warn',
      neutral: 'border-border bg-surface-2 text-text-subtle',
    },
  },
  defaultVariants: { tone: 'neutral' },
});

export type TStatusBadgeVariants = VariantProps<typeof statusBadgeVariants>;
