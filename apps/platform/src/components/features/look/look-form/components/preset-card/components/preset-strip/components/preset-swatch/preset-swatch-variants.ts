import { SIZE } from '@blog/config';
import { tv } from '@platform/utils/tv/tv';

export const presetSwatchVariants = tv({
  base: [
    'flex shrink-0 items-center justify-center rounded-platform-3 font-semibold',
  ],
  variants: {
    size: {
      [SIZE.SM]: 'size-7',
      [SIZE.MD]: 'size-8',
      [SIZE.LG]: 'size-9',
    },
    glyphSize: {
      [SIZE.SM]: 'text-platform-11',
      [SIZE.LG]: 'text-platform-15',
    },
  },
});
