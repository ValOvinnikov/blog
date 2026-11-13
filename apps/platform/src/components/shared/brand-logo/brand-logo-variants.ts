import { SIZE } from '@blog/config';
import { tv } from '@platform/utils/tv/tv';
import type { VariantProps } from 'tailwind-variants';

export const brandLogoVariants = tv({
  base: ['w-auto shrink-0'],
  variants: {
    size: {
      [SIZE.MD]: ['h-7'],
      [SIZE.LG]: ['h-9'],
    },
    isOnDark: {
      true: [],
      false: ['text-admin-logo-ink'],
    },
  },
  defaultVariants: {
    size: SIZE.MD,
    isOnDark: false,
  },
});

export type TBrandLogoVariants = VariantProps<typeof brandLogoVariants>;
