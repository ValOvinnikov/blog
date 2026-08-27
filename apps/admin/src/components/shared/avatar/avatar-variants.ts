import { tv } from '@admin/utils/tv/tv';
import type { VariantProps } from 'tailwind-variants';

export const avatarVariants = tv({
  base: ['inline-flex shrink-0 items-center justify-center uppercase'],
  variants: {
    variant: {
      table: [
        'size-7.5 rounded-admin-sm text-xs font-bold',
        'bg-admin-brand text-white',
      ],
      chip: [
        'size-5.5 rounded-full text-xs font-semibold',
        'bg-admin-line-2 text-admin-muted',
      ],
      switcher: [
        'size-[22px] rounded-[6px] text-[11px] font-semibold',
        'bg-admin-side-raised text-admin-side-text',
      ],
    },
  },
});

export type TAvatarVariants = VariantProps<typeof avatarVariants>;
