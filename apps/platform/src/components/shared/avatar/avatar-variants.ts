import { AVATAR_VARIANT } from '@platform/constants/avatar';
import { tv } from '@platform/utils/tv/tv';
import type { VariantProps } from 'tailwind-variants';

export const avatarVariants = tv({
  base: ['inline-flex shrink-0 items-center justify-center uppercase'],
  variants: {
    variant: {
      [AVATAR_VARIANT.TABLE]: [
        'size-7.5 rounded-platform-control text-platform-12-5 font-bold',
        'bg-platform-brand text-platform-on-brand-ink',
      ],
      [AVATAR_VARIANT.ACCOUNT]: [
        'size-7.5 rounded-full text-platform-12 font-semibold',
        'bg-platform-brand text-platform-on-brand-ink',
      ],
      [AVATAR_VARIANT.SWITCHER]: [
        'size-[22px] rounded-platform-control text-platform-11 font-bold',
        'bg-platform-brand-weak text-platform-brand-strong',
      ],
    },
  },
});

export type TAvatarVariants = VariantProps<typeof avatarVariants>;
