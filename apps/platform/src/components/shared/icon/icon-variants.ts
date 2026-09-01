import { SIZE } from '@blog/config';
import { tv } from '@platform/utils/tv/tv';
import type { VariantProps } from 'tailwind-variants';

export const iconVariants = tv({
  base: ['shrink-0'],
  variants: {
    size: {
      [SIZE.SM]: ['size-4'],
      [SIZE.MD]: ['size-4.5'],
      [SIZE.LG]: ['size-6'],
    },
  },
  defaultVariants: {
    size: SIZE.MD,
  },
});

export type TIconVariants = VariantProps<typeof iconVariants>;
