import { Size } from '@blog/config';
import { tv } from '@platform/utils/tv/tv';
import type { VariantProps } from 'tailwind-variants';

export const iconVariants = tv({
  base: ['shrink-0'],
  variants: {
    size: {
      [Size.SM]: ['size-4'],
      [Size.MD]: ['size-4.5'],
      [Size.LG]: ['size-6'],
    },
  },
  defaultVariants: {
    size: Size.MD,
  },
});

export type TIconVariants = VariantProps<typeof iconVariants>;
