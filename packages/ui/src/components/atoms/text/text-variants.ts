import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const textVariants = tv(
  {
    base: ['font-read'],
    variants: {
      variant: {
        lead: ['text-lead leading-[1.72]', 'text-text'],
        muted: ['text-lead leading-[1.72]', 'text-muted'],
        hero: ['text-base leading-[1.6]', 'text-muted'],
        card: ['text-card-copy leading-[1.55]', 'text-muted'],
        supporting: ['text-sm', 'text-text-muted'],
        statement: ['text-lg font-medium', 'text-text'],
        meta: ['text-meta', 'text-subtle'],
        emphasis: ['text-card-copy leading-[1.55] font-semibold', 'text-text'],
      },
    },
    defaultVariants: { variant: 'lead' },
  },
  {
    twMergeConfig: {
      extend: {
        classGroups: {
          'font-size': [{ text: ['lead', 'card-copy'] }],
        },
      },
    },
  },
);

export type TTextVariants = VariantProps<typeof textVariants>;
