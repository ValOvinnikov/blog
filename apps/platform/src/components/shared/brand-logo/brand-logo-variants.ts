import { tv } from '@platform/utils/tv/tv';
import { SIZE } from '@shinefold/config';
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
      false: ['text-platform-logo-ink'],
    },
  },
  defaultVariants: {
    size: SIZE.MD,
    isOnDark: false,
  },
});

export type TBrandLogoVariants = VariantProps<typeof brandLogoVariants>;
