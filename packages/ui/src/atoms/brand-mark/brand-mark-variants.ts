import { Size } from '@blog/config';
import { tv } from '@blog/ui/lib/styling';

export const brandMarkVariants = tv({
  base: ['inline-block shrink-0'],
  variants: {
    size: {
      [Size.SM]: ['size-5'],
      [Size.MD]: ['size-7'],
      [Size.LG]: ['size-9'],
    },
  },
  defaultVariants: {
    size: Size.MD,
  },
});
