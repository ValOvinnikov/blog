import { Size } from '@blog/config';
import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const proseVariants = tv({
  base: ['font-read text-text', 'leading-[1.7]'],
  variants: {
    size: {
      [Size.SM]: 'text-sm',
      [Size.MD]: 'text-prose',
      [Size.LG]: 'text-lg',
    },
  },
  defaultVariants: {
    size: Size.MD,
  },
});

export type TProseVariants = VariantProps<typeof proseVariants>;
