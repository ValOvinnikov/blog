import { SIZE } from '@blog/config';
import { tv } from '@platform/utils/tv/tv';

export const accentSwatchVariants = tv({
  base: ['inline-block shrink-0 align-middle'],
  variants: {
    size: {
      [SIZE.XS]: ['size-3.5 rounded-platform-3 max-lg:size-3'],
      [SIZE.SM]: [
        'size-4 rounded-platform-control border border-platform-line',
      ],
      [SIZE.MD]: [
        'size-5 rounded-platform-control border border-platform-line',
      ],
      [SIZE.LG]: [
        'size-10 rounded-platform-control shadow-platform ring-1 ring-inset ring-black/6',
      ],
    },
  },
  defaultVariants: { size: SIZE.MD },
});
