import { SIZE } from '@blog/config';
import { ICON_SIZE } from '@platform/constants/icon';
import { tv } from '@platform/utils/tv/tv';
import type { VariantProps } from 'tailwind-variants';

export const iconVariants = tv({
  base: ['shrink-0'],
  variants: {
    size: {
      [ICON_SIZE.PX_10]: ['size-2.5'],
      [ICON_SIZE.PX_12]: ['size-3'],
      [ICON_SIZE.PX_14]: ['size-3.5'],
      [ICON_SIZE.PX_15]: ['size-3.75'],
      [SIZE.SM]: ['size-4'],
      [ICON_SIZE.PX_17]: ['size-4.25'],
      [SIZE.MD]: ['size-4.5'],
      [ICON_SIZE.PX_20]: ['size-5'],
      [SIZE.LG]: ['size-6'],
    },
  },
  defaultVariants: {
    size: SIZE.MD,
  },
});

export type TIconVariants = VariantProps<typeof iconVariants>;
