import { tv, TYPOGRAPHY } from '@shinefold/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const textVariants = tv({
  variants: {
    variant: {
      lead: ['font-read text-lead leading-[1.72]', 'text-text'],
      muted: ['font-read text-lead leading-[1.72]', 'text-muted'],
      hero: ['font-read text-base leading-[1.6]', 'text-muted'],
      card: ['font-read text-lead leading-[1.55]', 'text-muted'],
      supporting: ['font-read text-lead', 'text-text-muted'],
      statement: ['font-read text-lg font-medium', 'text-text'],
      meta: ['font-read text-meta', 'text-subtle'],
      emphasis: [
        'font-read text-lead leading-[1.55] font-semibold',
        'text-text',
      ],
      footnote: ['font-read text-caption', 'text-subtle'],
    },
    textRole: TYPOGRAPHY,
  },
});

export type TTextVariants = VariantProps<typeof textVariants>;
