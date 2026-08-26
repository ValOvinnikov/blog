import { tv, type VariantProps } from 'tailwind-variants';

export const statusBadgeVariants = tv({
  slots: {
    root: [
      'inline-flex items-center gap-1.5',
      'rounded-full px-2.5 py-0.5',
      'text-[11.5px] font-semibold whitespace-nowrap',
    ],
    dot: ['size-1.5 rounded-full bg-current'],
  },
  variants: {
    tone: {
      ok: { root: ['text-admin-ok bg-admin-ok-weak'] },
      warn: { root: ['text-admin-warn bg-admin-warn-weak'] },
      bad: { root: ['text-admin-bad bg-admin-bad-weak'] },
      neutral: { root: ['text-admin-muted bg-admin-line-2'] },
      plan: { root: ['text-indigo-800 bg-admin-brand-weak'] },
    },
  },
  defaultVariants: { tone: 'neutral' },
});

export type TStatusBadgeVariants = VariantProps<typeof statusBadgeVariants>;
