import { SIZE } from '@blog/config';
import { tv } from '@platform/utils/tv/tv';
import type { VariantProps } from 'tailwind-variants';

export const brandMarkVariants = tv({
  base: ['shrink-0'],
  variants: {
    size: {
      [SIZE.SM]: ['size-[26px]'],
      [SIZE.MD]: ['size-7'],
    },
  },
  defaultVariants: {
    size: SIZE.MD,
  },
});

export type TBrandMarkVariants = VariantProps<typeof brandMarkVariants>;
