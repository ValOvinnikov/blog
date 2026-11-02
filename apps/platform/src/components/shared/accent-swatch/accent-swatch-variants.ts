import { SIZE } from '@blog/config';
import { tv } from '@platform/utils/tv/tv';

export const accentSwatchVariants = tv({
  base: ['inline-block shrink-0 align-middle'],
  variants: {
    size: {
      [SIZE.SM]: ['size-4 rounded-admin-control border border-admin-line'],
      [SIZE.MD]: ['size-5 rounded-admin-control border border-admin-line'],
      [SIZE.LG]: [
        'size-[52px] rounded-admin shadow-admin ring-1 ring-inset ring-black/6',
      ],
    },
  },
  defaultVariants: { size: SIZE.MD },
});
