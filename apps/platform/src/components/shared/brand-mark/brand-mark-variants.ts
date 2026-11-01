import { SIZE } from '@blog/config';
import { tv } from '@platform/utils/tv/tv';
import type { VariantProps } from 'tailwind-variants';

export const brandMarkVariants = tv({
  base: [
    'grid shrink-0 place-items-center rounded-admin-control',
    'bg-gradient-to-br from-[#6366f1] to-[#a855f7]',
    'font-bold text-white',
  ],
  variants: {
    size: {
      [SIZE.SM]: ['size-[26px] rounded-admin text-admin-14'],
      [SIZE.MD]: ['size-[26px] text-admin-13'],
      [SIZE.LG]: ['size-7 rounded-admin text-admin-15'],
      [SIZE.XL]: ['size-9 rounded-admin text-admin-20'],
    },
  },
  defaultVariants: {
    size: SIZE.MD,
  },
});

export type TBrandMarkVariants = VariantProps<typeof brandMarkVariants>;
