import { SIZE } from '@blog/config';
import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const proseVariants = tv({
  base: ['font-read text-text', 'leading-[1.7]'],
  variants: {
    size: {
      [SIZE.SM]: 'text-sm',
      [SIZE.MD]: 'text-prose',
      [SIZE.LG]: 'text-lg',
    },
  },
  defaultVariants: {
    size: SIZE.MD,
  },
});

export type TProseVariants = VariantProps<typeof proseVariants>;
