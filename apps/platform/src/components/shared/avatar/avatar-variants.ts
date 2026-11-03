import { tv } from '@platform/utils/tv/tv';
import type { VariantProps } from 'tailwind-variants';

export const avatarVariants = tv({
  base: ['inline-flex shrink-0 items-center justify-center uppercase'],
  variants: {
    variant: {
      table: [
        'size-7.5 rounded-admin-control text-admin-12-5 font-bold',
        'bg-admin-brand text-white',
      ],
      account: [
        'size-7.5 rounded-full text-admin-12 font-semibold',
        'bg-admin-brand text-white',
      ],
      switcher: [
        'size-[22px] rounded-admin-control text-admin-11 font-bold',
        'bg-admin-brand-weak text-admin-brand-strong',
      ],
    },
  },
});

export type TAvatarVariants = VariantProps<typeof avatarVariants>;
