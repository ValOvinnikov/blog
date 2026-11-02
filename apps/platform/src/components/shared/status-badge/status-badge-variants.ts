import { tv } from '@platform/utils/tv/tv';
import type { VariantProps } from 'tailwind-variants';

export const statusBadgeVariants = tv({
  slots: {
    root: [
      'inline-flex items-center gap-1.5',
      'rounded-full px-2.5 py-0.5',
      'text-admin-11-5 leading-4 font-semibold whitespace-nowrap',
    ],
    dot: ['size-1.5 shrink-0 rounded-full bg-current'],
  },
  variants: {
    tone: {
      ok: { root: ['text-admin-ok bg-admin-ok-weak'] },
      warn: { root: ['text-admin-warn bg-admin-warn-weak'] },
      bad: { root: ['text-admin-bad bg-admin-bad-weak'] },
      neutral: { root: ['text-admin-muted bg-admin-pill-neutral'] },
      brand: { root: ['text-admin-brand bg-admin-brand-weak'] },
      plan: { root: ['text-admin-brand-strong bg-admin-brand-weak'] },
      growth: {
        root: [
          'h-5 shrink-0 rounded-admin-10 border border-admin-line px-[7px] py-0',
          'leading-none tracking-[0.1px] text-admin-muted bg-admin-pill-neutral',
        ],
        dot: ['hidden'],
      },
    },
  },
  defaultVariants: { tone: 'neutral' },
});

export type TStatusBadgeVariants = VariantProps<typeof statusBadgeVariants>;
