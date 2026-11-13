import { tv } from '@platform/utils/tv/tv';
import type { VariantProps } from 'tailwind-variants';

export const statusBadgeVariants = tv({
  slots: {
    root: [
      'inline-flex items-center gap-1.5',
      'rounded-full px-2.5 py-0.5',
      'text-platform-11-5 leading-4 font-semibold whitespace-nowrap',
    ],
    dot: ['size-1.5 shrink-0 rounded-full bg-current'],
  },
  variants: {
    tone: {
      ok: { root: ['text-platform-ok bg-platform-ok-weak'] },
      warn: { root: ['text-platform-warn bg-platform-warn-weak'] },
      bad: { root: ['text-platform-bad bg-platform-bad-weak'] },
      neutral: { root: ['text-platform-muted bg-platform-pill-neutral'] },
      brand: { root: ['text-platform-brand bg-platform-brand-weak'] },
      plan: { root: ['text-platform-brand-strong bg-platform-brand-weak'] },
      growth: {
        root: [
          'h-5 shrink-0 rounded-platform-10 border border-platform-line px-[7px] py-0',
          'leading-none tracking-[0.1px] text-platform-muted bg-platform-pill-neutral',
        ],
        dot: ['hidden'],
      },
    },
  },
  defaultVariants: { tone: 'neutral' },
});

export type TStatusBadgeVariants = VariantProps<typeof statusBadgeVariants>;
