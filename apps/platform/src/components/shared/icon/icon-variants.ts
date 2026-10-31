import { ICON_SIZE } from '@platform/constants/icon';
import { tv } from '@platform/utils/tv/tv';
import type { VariantProps } from 'tailwind-variants';

export const iconVariants = tv({
  base: ['shrink-0'],
  variants: {
    size: {
      [ICON_SIZE.XXXS]: ['size-2.5'],
      [ICON_SIZE.XXS]: ['size-3'],
      [ICON_SIZE.XS]: ['size-3.5'],
      [ICON_SIZE.SM]: ['size-3.75'],
      [ICON_SIZE.MD]: ['size-4'],
      [ICON_SIZE.LG]: ['size-4.25'],
      [ICON_SIZE.XL]: ['size-4.5'],
      [ICON_SIZE.XXL]: ['size-5'],
      [ICON_SIZE.XXXL]: ['size-6'],
    },
  },
  defaultVariants: {
    size: ICON_SIZE.XL,
  },
});

export type TIconVariants = VariantProps<typeof iconVariants>;
